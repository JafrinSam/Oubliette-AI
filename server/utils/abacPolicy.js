// A central engine to evaluate complex zero-trust rules
const CLEARANCE_SCORES = {
    'UNCLASSIFIED': 1,
    'INTERNAL': 2,
    'RESTRICTED': 3,
    'TOP_SECRET': 4
};

/**
 * Evaluates whether a user has access to a specific resource (Dataset or Script)
 * based on ABAC attributes: Clearance Level and Department.
 * 
 * Rules:
 * 1. ML_ADMIN has universal access.
 * 2. Resource owners always have access.
 * 3. Resources that are not 'isShared' are private to owners/admins only.
 * 4. User's department must match resource's departmentOwner (unless resource is GENERAL).
 * 5. User's clearance score must be >= resource's sensitivity score.
 */
exports.evaluateAccess = (user, resource) => {
    // 1. RBAC / Ownership Overrides
    if (user.role === 'ML_ADMIN') return { granted: true };
    if (resource.ownerId === user.id) return { granted: true };

    // ✨ GLOBAL ACESS RULE: UNCLASSIFIED resources are public to all users
    if (resource.sensitivity === 'UNCLASSIFIED') return { granted: true };

    // 2. Resource Status Check
    if (!resource.isShared) {
        return { granted: false, reason: "Resource is private and not shared." };
    }

    // 3. ABAC Rule: Department Micro-segmentation
    if (resource.departmentOwner !== 'GENERAL' && resource.departmentOwner !== user.department) {
        return { granted: false, reason: `Cross-department access denied. Requires ${resource.departmentOwner} affiliation.` };
    }

    // 4. ABAC Rule: Cryptographic Clearance Level Check
    const userScore = CLEARANCE_SCORES[user.clearanceLevel] || 0;
    const resourceScore = CLEARANCE_SCORES[resource.sensitivity] || 0;

    if (userScore < resourceScore) {
        return { granted: false, reason: `Clearance violation. User (${user.clearanceLevel}) lacks clearance for Resource (${resource.sensitivity}).` };
    }

    // Explicitly grant access if no negative rules triggered
    return { granted: true };
};

/**
 * Shared management guard to verify if a user has permission to modify or delete a resource.
 * Returns true if the request is authorised; sends 403 and returns false otherwise.
 * 
 * Rules:
 * 1. ML_ADMIN always has full access.
 * 2. Resource owner always has full access.
 * 3. Any user belonging to the resource's assigned 'managementDepartment' has full access.
 */
exports.assertManagementAccess = (resource, req, res) => {
    const user = req.user;

    if (user.role === 'ML_ADMIN') {
        return true;
    }

    // `ownerId` might not exist on all models (e.g. RuntimeImage traditionally didn't have it, but we handle gracefully)
    if (resource.ownerId && resource.ownerId === user.id) {
        return true;
    }

    if (resource.managementDepartment && resource.managementDepartment === user.department && resource.managementDepartment !== 'GENERAL') {
        return true;
    }

    res.status(403).json({ error: 'Access Denied: You do not have management access over this resource based on your Role or Team affiliation.' });
    return false;
};
