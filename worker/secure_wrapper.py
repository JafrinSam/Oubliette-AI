#!/usr/bin/env python3
import argparse
import sys
import json
import traceback
import importlib.util
import os
import ast
import signal
import random
import time
import multiprocessing
import resource  # <--- NEW: For RAM/CPU limits
from multiprocessing import Process, Queue

import bandit
from bandit.core import manager as bandit_manager
from bandit.core import config as bandit_config
from bandit.core.issue import SEVERITY

# =========================
# 🔒 SECURITY CONSTANTS
# =========================

METRICS_START_TAG = "__METRICS_START__"
METRICS_END_TAG   = "__METRICS_END__"
ERROR_TAG         = "__SECURE_ERROR__"

ALLOWED_DATA_PREFIX  = "/app/data/"
ALLOWED_SAVE_PREFIX  = "/outputs/"

# Resource Limits (Adjust based on your server specs)
MAX_RAM_BYTES       = 16 * 1024 * 1024 * 1024  # 16 GB RAM Limit per job
MAX_DATASET_FILES   = 50000                    # Prevent inode exhaustion (1 million files)
MAX_DATASET_SIZE    = 50 * 1024 * 1024 * 1024  # 50 GB Dataset Cap

# Allowed dataset formats
ALLOWED_EXTENSIONS = {
    "csv", "json", "txt", "parquet", "arrow",
    "jpg", "jpeg", "png", "bmp", "gif", "tiff",
    "mp4", "avi", "mov", "mkv",
    "zip", "tar", "gz"
}

FORBIDDEN_MODULES = {
    "os", "sys", "subprocess", "socket", "shutil",
    "ctypes", "multiprocessing", "threading",
    "resource", "signal", "inspect", "importlib"
}

DEFAULT_MAX_SECONDS = 7200
HARD_SYSTEM_CAP     = 86400

# =========================
# 🛡️ DATASET SAFETY (The "Bomb" Check)
# =========================

def scan_dataset_safety(path):
    """
    Prevents Zip Bombs or Inode Exhaustion attacks.
    """
    if not os.path.exists(path):
        return # Let validation handle missing files later

    # If it's a file, check size immediately
    if os.path.isfile(path):
        if os.path.getsize(path) > MAX_DATASET_SIZE:
            raise RuntimeError(f"Dataset exceeds size limit ({MAX_DATASET_SIZE/1e9}GB)")
        return

    # If directory, scan it safely
    total_size = 0
    total_files = 0
    
    for root, dirs, files in os.walk(path):
        for f in files:
            total_files += 1
            if total_files > MAX_DATASET_FILES:
                raise RuntimeError(f"Dataset contains too many files (>{MAX_DATASET_FILES}). Possible DoS attack.")
            
            fp = os.path.join(root, f)
            total_size += os.path.getsize(fp)
            
            if total_size > MAX_DATASET_SIZE:
                raise RuntimeError(f"Dataset directory exceeds size limit ({MAX_DATASET_SIZE/1e9}GB)")

# =========================
# 🔍 SECURITY SCANS (Bandit + AST)
# =========================

def scan_code_with_bandit(script_path):
    try:
        b_conf = bandit_config.BanditConfig()
        b_mgr = bandit_manager.BanditManager(b_conf, open_mode="r", debug=False, verbose=False)
        b_mgr.discover_files([script_path])
        b_mgr.run_tests()
        
        issues = b_mgr.get_issue_list()
        dangerous = [i for i in issues if i.severity >= SEVERITY.MEDIUM]
        
        if dangerous:
            print(f"{ERROR_TAG} Security Audit Failed (Bandit):")
            for issue in dangerous:
                print(f"❌ Line {issue.lineno}: {issue.text}")
            return False
        return True
    except Exception as e:
        print(f"{ERROR_TAG} Bandit Error: {e}")
        return False

def check_forbidden_imports(script_path):
    try:
        with open(script_path, "r") as f:
            tree = ast.parse(f.read(), filename=script_path)
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for name in node.names:
                    if name.name.split(".")[0] in FORBIDDEN_MODULES:
                        print(f"{ERROR_TAG} Forbidden import '{name.name}'")
                        return False
            elif isinstance(node, ast.ImportFrom):
                if node.module and node.module.split(".")[0] in FORBIDDEN_MODULES:
                    print(f"{ERROR_TAG} Forbidden import from '{node.module}'")
                    return False
        return True
    except Exception as e:
        print(f"{ERROR_TAG} AST Parse Failed: {e}")
        return False

# =========================
# 📂 PATH VALIDATION
# =========================

def validate_dataset_path(dataset_path):
    abs_data = os.path.abspath(dataset_path)
    if not abs_data.startswith(ALLOWED_DATA_PREFIX):
        if abs_data != "/app/data.csv": 
             pass # In production, restrict this strictly
    
    if os.path.isfile(abs_data):
        ext = abs_data.split(".")[-1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise RuntimeError(f"File type .{ext} not allowed.")

def validate_save_path(save_path):
    abs_save = os.path.abspath(save_path)
    if not abs_save.startswith(ALLOWED_SAVE_PREFIX):
        raise RuntimeError("Output path outside sandbox.")

# =========================
# 📦 ISOLATED EXECUTION (The "Sandbox")
# =========================

def _user_code_runner(script_path, dataset_path, save_path, params, dataset_type, mode, gpu_id, result_queue):
    """
    Runs in a CHILD PROCESS.
    Enforces RAM limits, GPU isolation, and executes the specific mode logic.
    """
    try:
        # 1️⃣ Enforce RAM Limit (OOM Killer prevention)
        # Sets soft and hard limit for Address Space
        try:
            resource.setrlimit(resource.RLIMIT_AS, (MAX_RAM_BYTES, MAX_RAM_BYTES))
        except ValueError:
            print(f"WARN: Could not set RAM limit (requires privileges or Docker limit).")

        # 2️⃣ GPU Isolation
        # If running multiple containers, we can strictly pin this process to one GPU
        if gpu_id is not None:
            os.environ["CUDA_VISIBLE_DEVICES"] = str(gpu_id)

        # 3️⃣ Load Module
        spec = importlib.util.spec_from_file_location("user_training_code", script_path)
        module = importlib.util.module_from_spec(spec)
        sys.modules["user_training_code"] = module
        spec.loader.exec_module(module)

        metrics = {}

        # 4️⃣ EXECUTION MODES
        if mode == "train":
            if not hasattr(module, "train"):
                raise RuntimeError("Mode 'train' requires a 'train(...)' function.")
            
            metrics = module.train(
                dataset_path=dataset_path,
                save_path=save_path,
                hyperparameters=params,
                dataset_type=dataset_type
            )

        elif mode == "agent":
            # Agents might have 'run' or 'interact'
            func = getattr(module, "run", getattr(module, "agent_run", None))
            if not func:
                raise RuntimeError("Mode 'agent' requires a 'run()' or 'agent_run()' function.")
            
            # Agents might not return metrics immediately, or return a logs dict
            metrics = func(
                config=params,
                data_source=dataset_path
            )
            
        elif mode == "inference":
            if not hasattr(module, "predict"):
                raise RuntimeError("Mode 'inference' requires a 'predict(...)' function.")
            
            metrics = module.predict(
                input_path=dataset_path,
                output_path=save_path
            )

        # Send success back
        result_queue.put({"status": "success", "metrics": metrics})

    except MemoryError:
        result_queue.put({"status": "error", "error": "OOM: Script exceeded RAM limit."})
    except Exception as e:
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        result_queue.put({"status": "error", "error": error_msg})

# =========================
# 🎯 MAIN
# =========================

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--script", required=True)
    parser.add_argument("--dataset", required=True)
    parser.add_argument("--save-path", required=True)
    parser.add_argument("--dataset-type", default="auto")
    parser.add_argument("--params", default="{}")
    parser.add_argument("--max-seconds", type=int, default=DEFAULT_MAX_SECONDS)
    parser.add_argument("--mode", default="train", choices=["train", "agent", "inference"]) # <--- Upgrade 1
    parser.add_argument("--gpu-id", default=None, help="Specific GPU ID to pin (0, 1, etc)")

    args = parser.parse_args()

    # 1️⃣ Security & Safety Scans
    if not scan_code_with_bandit(args.script): sys.exit(1)
    if not check_forbidden_imports(args.script): sys.exit(1)
    
    try:
        validate_dataset_path(args.dataset)
        validate_save_path(args.save_path)
        scan_dataset_safety(args.dataset) # <--- Upgrade 3 (Bomb Check)
    except Exception as e:
        print(f"{ERROR_TAG} Path/Data Safety Error: {e}")
        sys.exit(1)

    # 2️⃣ Determinism
    random.seed(42)
    try:
        import numpy as np
        np.random.seed(42)
    except ImportError: pass

    # 3️⃣ Execute in Isolated Child Process
    print(f"⚡ Secure Runner ({args.mode.upper()} Mode) started...")
    start_time = time.time()
    
    result_queue = Queue()
    
    p = Process(target=_user_code_runner, args=(
        args.script, 
        args.dataset, 
        args.save_path, 
        json.loads(args.params), 
        args.dataset_type,
        args.mode,        # <--- Passing Mode
        args.gpu_id,      # <--- Passing GPU ID
        result_queue
    ))
    
    p.start()
    p.join(timeout=min(args.max_seconds, HARD_SYSTEM_CAP))

    # 4️⃣ Handle Lifecycle
    if p.is_alive():
        print(f"\n{ERROR_TAG} TIMEOUT: Execution exceeded {args.max_seconds}s. Killing process.")
        p.terminate()
        time.sleep(1)
        if p.is_alive(): p.kill()
        sys.exit(1)
    
    if p.exitcode != 0:
        # 137 = OOM Kill (Out of Memory)
        if p.exitcode == -9 or p.exitcode == 137: 
            print(f"\n{ERROR_TAG} CRITICAL: Process Killed (OOM or Force Kill).")
        else:
            print(f"\n{ERROR_TAG} CRITICAL: User script crashed (Exit Code: {p.exitcode}).")
        sys.exit(1)

    if not result_queue.empty():
        result = result_queue.get()
        if result["status"] == "success":
            metrics = result["metrics"] or {}
            if not isinstance(metrics, dict): metrics = {"result": str(metrics)}
            
            metrics["_system_status"] = "success"
            metrics["_elapsed_seconds"] = int(time.time() - start_time)
            
            print(f"\n{METRICS_START_TAG}{json.dumps(metrics)}{METRICS_END_TAG}")
        else:
            print(f"{ERROR_TAG} Execution Error:\n{result['error']}")
            sys.exit(1)
    else:
        print(f"{ERROR_TAG} Unknown Error: No results returned.")
        sys.exit(1)

if __name__ == "__main__":
    main()