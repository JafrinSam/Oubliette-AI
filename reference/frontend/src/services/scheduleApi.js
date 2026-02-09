import { handleResponse } from "./handleResponse";

const API_BASE_URL = 'http://localhost:1337/api';

export const scheduleApi = {
  // This one was already working (returns 200), keeping it safe.
  getByDay: async (day) => {
    const query = new URLSearchParams();
    query.append('filters[day][$eq]', day);
    
    // Populate relations for the schedule entry
    query.append('populate[show][populate][rjs][populate][photo][fields][0]', 'url');
    query.append('populate[show][populate][CoverImage][fields][0]', 'url');
    
    query.append('sort', 'startTime:asc');

    const response = await fetch(`${API_BASE_URL}/weekly-schedules?${query.toString()}`);
    return handleResponse(response);
  },

  // THE FIX IS HERE
  getFeatured: async () => {
    const query = new URLSearchParams();
    
    // 1. Filter
    query.append('filters[IsLive][$eq]', 'true');
    
    // 2. Populate CoverImage (Specific fields only)
    query.append('populate[CoverImage][fields][0]', 'url');
    query.append('populate[CoverImage][fields][1]', 'alternativeText');
    
    // 3. Populate RJs (Specific fields only)
    query.append('populate[rjs][populate][photo][fields][0]', 'url');
    
    // 4. Populate Weekly Schedules (CRITICAL FIX)
    // Do NOT use '*' here. Explicitly ask for time fields only.
    // This prevents it from trying to load the parent 'show' relation again.
    query.append('populate[weekly_schedules][fields][0]', 'day');
    query.append('populate[weekly_schedules][fields][1]', 'startTime');
    query.append('populate[weekly_schedules][fields][2]', 'endTime');
    
    query.append('pagination[limit]', '1');

    const response = await fetch(`${API_BASE_URL}/shows?${query.toString()}`);
    return handleResponse(response);
  }
};