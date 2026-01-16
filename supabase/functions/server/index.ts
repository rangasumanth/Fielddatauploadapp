import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2";
const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Create S3 bucket on startup
const BUCKET_NAME = 'make-54e4d920-field-videos';
(async () => {
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
  if (!bucketExists) {
    await supabase.storage.createBucket(BUCKET_NAME, { public: false });
    console.log(`Created bucket: ${BUCKET_NAME}`);
  }
})();

// Health check endpoint
app.get("/make-server-54e4d920/health", (c) => {
  return c.json({ status: "ok" });
});

// Test endpoint for debugging
app.get("/make-server-54e4d920/test", (c) => {
  return c.json({ 
    message: "Test endpoint working",
    timestamp: new Date().toISOString(),
    env: Deno.env.get('SUPABASE_URL') ? 'Supabase env available' : 'Supabase env missing'
  });
});

// Get location data from IP (server-side fetch bypasses firewall)
app.get("/make-server-54e4d920/location/ip", async (c) => {
  try {
    console.log("Fetching IP-based location...");
    
    // Try multiple services with fallback
    const services = [
      'https://ipapi.co/json/',
      'https://ip-api.com/json/'
    ];
    
    for (const service of services) {
      try {
        console.log(`Trying service: ${service}`);
        const response = await fetch(service, {
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Got location from ${service}:`, data);
          
          if (service.includes('ipapi.co')) {
            return c.json({
              success: true,
              city: data.city || 'Unknown',
              state: data.region || 'Unknown',
              ip: data.ip_address || data.ip
            });
          } else if (service.includes('ip-api.com')) {
            return c.json({
              success: true,
              city: data.city || 'Unknown',
              state: data.regionName || 'Unknown',
              ip: data.query
            });
          }
        }
      } catch (error) {
        console.warn(`Service ${service} failed:`, error);
        continue;
      }
    }
    
    // All services failed
    console.log("All IP services failed");
    return c.json({
      success: false,
      city: 'Unknown',
      state: 'Unknown'
    }, 500);
  } catch (error) {
    console.error('Error fetching location:', error);
    return c.json({
      success: false,
      error: `Failed to fetch location: ${error}`
    }, 500);
  }
});

// Session Management - Store user info
app.post("/make-server-54e4d920/session", async (c) => {
  try {
    const { sessionId, userName, email } = await c.req.json();
    
    if (!sessionId || !userName || !email) {
      return c.json({ error: "sessionId, userName, and email are required" }, 400);
    }

    await kv.set(`session:${sessionId}`, { userName, email, createdAt: new Date().toISOString() });
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error storing session: ${error}`);
    return c.json({ error: `Failed to store session: ${error}` }, 500);
  }
});

// Get session info
app.get("/make-server-54e4d920/session/:sessionId", async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    const session = await kv.get(`session:${sessionId}`);
    
    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }
    
    return c.json(session);
  } catch (error) {
    console.log(`Error retrieving session: ${error}`);
    return c.json({ error: `Failed to retrieve session: ${error}` }, 500);
  }
});

// Submit test data
app.post("/make-server-54e4d920/tests", async (c) => {
  try {
    const testData = await c.req.json();
    
    if (!testData.testId) {
      return c.json({ error: "testId is required" }, 400);
    }

    const existingTest = await kv.get(`test:${testData.testId}`);
    const now = new Date().toISOString();
    const existingVideos = Array.isArray(existingTest?.videos) ? existingTest.videos : [];
    const mergedVideos = Array.isArray(testData.videos) ? testData.videos : existingVideos;

    // Store test metadata
    await kv.set(`test:${testData.testId}`, {
      ...existingTest,
      ...testData,
      testId: testData.testId,
      videos: mergedVideos,
      videoFileName: testData.videoFileName ?? existingTest?.videoFileName,
      videoUrl: testData.videoUrl ?? existingTest?.videoUrl,
      status: testData.status ?? existingTest?.status ?? 'pending',
      createdAt: existingTest?.createdAt ?? now,
      updatedAt: now
    });

    const metadata = testData.metadata || {};
    const geo = testData.geoLocation || {};
    const user = testData.userInfo || {};

    await supabase.from('tests').upsert({
      test_id: testData.testId,
      session_id: testData.sessionId ?? null,
      user_name: user.userName ?? null,
      email: user.email ?? null,
      geo_latitude: geo.latitude ?? null,
      geo_longitude: geo.longitude ?? null,
      geo_city: geo.city ?? null,
      geo_state: geo.state ?? null,
      geo_accuracy: geo.accuracy ?? null,
      geo_timestamp: geo.timestamp ?? null,
      metadata_date: metadata.date ?? null,
      device_id: metadata.deviceId ?? null,
      device_type: metadata.deviceType ?? null,
      test_cycle: metadata.testCycle ?? null,
      location: metadata.location ?? null,
      environment: metadata.environment ?? null,
      time_start: metadata.timeStart ?? null,
      time_end: metadata.timeEnd ?? null,
      road_type: metadata.roadType ?? null,
      posted_speed_limit: metadata.postedSpeedLimit ?? null,
      number_of_lanes: metadata.numberOfLanes ?? null,
      traffic_density: metadata.trafficDensity ?? null,
      road_heading: metadata.roadHeading ?? null,
      camera_heading: metadata.cameraHeading ?? null,
      lighting: metadata.lighting ?? null,
      weather_condition: metadata.weatherCondition ?? null,
      severity: metadata.severity ?? null,
      measured_distance: metadata.measuredDistance ?? null,
      mount_height: metadata.mountHeight ?? null,
      pitch_angle: metadata.pitchAngle ?? null,
      vehicle_capture_view: metadata.vehicleCaptureView ?? null,
      external_battery_plugged_in: metadata.externalBatteryPluggedIn ?? null,
      firmware: metadata.firmware ?? null,
      var_version: metadata.varVersion ?? null,
      status: testData.status ?? existingTest?.status ?? 'pending',
      created_at: existingTest?.createdAt ?? now,
      updated_at: now
    });
    
    return c.json({ success: true, testId: testData.testId });
  } catch (error) {
    console.log(`Error storing test data: ${error}`);
    return c.json({ error: `Failed to store test data: ${error}` }, 500);
  }
});

// Update test metadata
app.put("/make-server-54e4d920/tests/:testId", async (c) => {
  try {
    const testId = c.req.param('testId');
    const updates = await c.req.json();
    const test = await kv.get(`test:${testId}`);
    const { data: testRow } = await supabase.from('tests').select('*').eq('test_id', testId).maybeSingle();

    const now = new Date().toISOString();
    const base = test ?? {
      testId,
      userInfo: {
        userName: testRow?.user_name ?? '',
        email: testRow?.email ?? ''
      },
      geoLocation: {
        latitude: testRow?.geo_latitude ?? null,
        longitude: testRow?.geo_longitude ?? null,
        city: testRow?.geo_city ?? '',
        state: testRow?.geo_state ?? '',
        accuracy: testRow?.geo_accuracy ?? null,
        timestamp: testRow?.geo_timestamp ?? null
      },
      metadata: {
        date: testRow?.metadata_date ?? '',
        deviceId: testRow?.device_id ?? '',
        deviceType: testRow?.device_type ?? '',
        testCycle: testRow?.test_cycle ?? '',
        location: testRow?.location ?? '',
        environment: testRow?.environment ?? '',
        timeStart: testRow?.time_start ?? '',
        timeEnd: testRow?.time_end ?? '',
        roadType: testRow?.road_type ?? '',
        postedSpeedLimit: testRow?.posted_speed_limit ?? '',
        numberOfLanes: testRow?.number_of_lanes ?? '',
        trafficDensity: testRow?.traffic_density ?? '',
        roadHeading: testRow?.road_heading ?? '',
        cameraHeading: testRow?.camera_heading ?? '',
        lighting: testRow?.lighting ?? '',
        weatherCondition: testRow?.weather_condition ?? '',
        severity: testRow?.severity ?? '',
        measuredDistance: testRow?.measured_distance ?? '',
        mountHeight: testRow?.mount_height ?? '',
        pitchAngle: testRow?.pitch_angle ?? '',
        vehicleCaptureView: testRow?.vehicle_capture_view ?? '',
        externalBatteryPluggedIn: testRow?.external_battery_plugged_in ?? false,
        firmware: testRow?.firmware ?? '',
        varVersion: testRow?.var_version ?? ''
      },
      status: testRow?.status ?? 'pending',
      createdAt: testRow?.created_at ?? now,
      updatedAt: testRow?.updated_at ?? now
    };
    const merged = {
      ...base,
      ...updates,
      testId,
      metadata: updates.metadata ?? base.metadata,
      updatedAt: now
    };

    await kv.set(`test:${testId}`, merged);

    const mergedMetadata = merged.metadata || {};
    const mergedGeo = merged.geoLocation || {};
    const mergedUser = merged.userInfo || {};

    await supabase.from('tests').upsert({
      test_id: testId,
      session_id: merged.sessionId ?? null,
      user_name: mergedUser.userName ?? null,
      email: mergedUser.email ?? null,
      geo_latitude: mergedGeo.latitude ?? null,
      geo_longitude: mergedGeo.longitude ?? null,
      geo_city: mergedGeo.city ?? null,
      geo_state: mergedGeo.state ?? null,
      geo_accuracy: mergedGeo.accuracy ?? null,
      geo_timestamp: mergedGeo.timestamp ?? null,
      metadata_date: mergedMetadata.date ?? null,
      device_id: mergedMetadata.deviceId ?? null,
      device_type: mergedMetadata.deviceType ?? null,
      test_cycle: mergedMetadata.testCycle ?? null,
      location: mergedMetadata.location ?? null,
      environment: mergedMetadata.environment ?? null,
      time_start: mergedMetadata.timeStart ?? null,
      time_end: mergedMetadata.timeEnd ?? null,
      road_type: mergedMetadata.roadType ?? null,
      posted_speed_limit: mergedMetadata.postedSpeedLimit ?? null,
      number_of_lanes: mergedMetadata.numberOfLanes ?? null,
      traffic_density: mergedMetadata.trafficDensity ?? null,
      road_heading: mergedMetadata.roadHeading ?? null,
      camera_heading: mergedMetadata.cameraHeading ?? null,
      lighting: mergedMetadata.lighting ?? null,
      weather_condition: mergedMetadata.weatherCondition ?? null,
      severity: mergedMetadata.severity ?? null,
      measured_distance: mergedMetadata.measuredDistance ?? null,
      mount_height: mergedMetadata.mountHeight ?? null,
      pitch_angle: mergedMetadata.pitchAngle ?? null,
      vehicle_capture_view: mergedMetadata.vehicleCaptureView ?? null,
      external_battery_plugged_in: mergedMetadata.externalBatteryPluggedIn ?? null,
      firmware: mergedMetadata.firmware ?? null,
      var_version: mergedMetadata.varVersion ?? null,
      latest_video_file_name: merged.videoFileName ?? null,
      latest_video_url: merged.videoUrl ?? null,
      status: merged.status ?? 'pending',
      created_at: merged.createdAt ?? now,
      updated_at: now
    });

    return c.json({ success: true, testId });
  } catch (error) {
    console.log(`Error updating test: ${error}`);
    return c.json({ error: `Failed to update test: ${error}` }, 500);
  }
});

// Get test by ID
app.get("/make-server-54e4d920/tests/:testId", async (c) => {
  try {
    const testId = c.req.param('testId');
    const { data: testRow } = await supabase.from('tests').select('*').eq('test_id', testId).maybeSingle();

    if (!testRow) {
      return c.json({ error: "Test not found" }, 404);
    }

    const { data: videos } = await supabase.from('test_videos').select('*').eq('test_id', testId).order('uploaded_at', { ascending: true });

    const test = {
      testId: testRow.test_id,
      userInfo: { userName: testRow.user_name, email: testRow.email },
      geoLocation: {
        latitude: testRow.geo_latitude,
        longitude: testRow.geo_longitude,
        city: testRow.geo_city,
        state: testRow.geo_state,
        accuracy: testRow.geo_accuracy,
        timestamp: testRow.geo_timestamp
      },
      metadata: {
        date: testRow.metadata_date,
        deviceId: testRow.device_id,
        deviceType: testRow.device_type,
        testCycle: testRow.test_cycle,
        location: testRow.location,
        environment: testRow.environment,
        timeStart: testRow.time_start,
        timeEnd: testRow.time_end,
        roadType: testRow.road_type,
        postedSpeedLimit: testRow.posted_speed_limit,
        numberOfLanes: testRow.number_of_lanes,
        trafficDensity: testRow.traffic_density,
        roadHeading: testRow.road_heading,
        cameraHeading: testRow.camera_heading,
        lighting: testRow.lighting,
        weatherCondition: testRow.weather_condition,
        severity: testRow.severity,
        measuredDistance: testRow.measured_distance,
        mountHeight: testRow.mount_height,
        pitchAngle: testRow.pitch_angle,
        vehicleCaptureView: testRow.vehicle_capture_view,
        externalBatteryPluggedIn: testRow.external_battery_plugged_in,
        firmware: testRow.firmware,
        varVersion: testRow.var_version
      },
      videos: (videos || []).map((video) => ({
        fileName: video.file_name,
        url: video.url,
        size: video.size,
        type: video.type,
        uploadedAt: video.uploaded_at
      })),
      videoFileName: testRow.latest_video_file_name,
      videoUrl: testRow.latest_video_url,
      status: testRow.status,
      createdAt: testRow.created_at,
      updatedAt: testRow.updated_at
    };

    return c.json(test);
  } catch (error) {
    console.log(`Error retrieving test: ${error}`);
    return c.json({ error: `Failed to retrieve test: ${error}` }, 500);
  }
});

// Get all tests
app.get("/make-server-54e4d920/tests", async (c) => {
  try {
    const { data: testRows } = await supabase.from('tests').select('*').order('created_at', { ascending: false });
    const { data: videoRows } = await supabase.from('test_videos').select('*').order('uploaded_at', { ascending: true });

    const videosByTest: Record<string, any[]> = {};
    (videoRows || []).forEach((video) => {
      if (!videosByTest[video.test_id]) {
        videosByTest[video.test_id] = [];
      }
      videosByTest[video.test_id].push(video);
    });

    const tests = (testRows || []).map((testRow) => ({
      testId: testRow.test_id,
      userInfo: { userName: testRow.user_name, email: testRow.email },
      geoLocation: {
        latitude: testRow.geo_latitude,
        longitude: testRow.geo_longitude,
        city: testRow.geo_city,
        state: testRow.geo_state,
        accuracy: testRow.geo_accuracy,
        timestamp: testRow.geo_timestamp
      },
      metadata: {
        date: testRow.metadata_date,
        deviceId: testRow.device_id,
        deviceType: testRow.device_type,
        testCycle: testRow.test_cycle,
        location: testRow.location,
        environment: testRow.environment,
        timeStart: testRow.time_start,
        timeEnd: testRow.time_end,
        roadType: testRow.road_type,
        postedSpeedLimit: testRow.posted_speed_limit,
        numberOfLanes: testRow.number_of_lanes,
        trafficDensity: testRow.traffic_density,
        roadHeading: testRow.road_heading,
        cameraHeading: testRow.camera_heading,
        lighting: testRow.lighting,
        weatherCondition: testRow.weather_condition,
        severity: testRow.severity,
        measuredDistance: testRow.measured_distance,
        mountHeight: testRow.mount_height,
        pitchAngle: testRow.pitch_angle,
        vehicleCaptureView: testRow.vehicle_capture_view,
        externalBatteryPluggedIn: testRow.external_battery_plugged_in,
        firmware: testRow.firmware,
        varVersion: testRow.var_version
      },
      videos: (videosByTest[testRow.test_id] || []).map((video) => ({
        fileName: video.file_name,
        url: video.url,
        size: video.size,
        type: video.type,
        uploadedAt: video.uploaded_at
      })),
      videoFileName: testRow.latest_video_file_name,
      videoUrl: testRow.latest_video_url,
      status: testRow.status,
      createdAt: testRow.created_at,
      updatedAt: testRow.updated_at
    }));

    return c.json({ tests });
  } catch (error) {
    console.log(`Error retrieving tests: ${error}`);
    return c.json({ error: `Failed to retrieve tests: ${error}` }, 500);
  }
});

// Upload video to Supabase Storage
app.post("/make-server-54e4d920/upload-video", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const testId = formData.get('testId') as string;
    
    if (!file || !testId) {
      return c.json({ error: "file and testId are required" }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    const now = new Date().toISOString();
    const fileName = `${testId}-${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.log(`Supabase storage error: ${error.message}`);
      return c.json({ error: `Upload failed: ${error.message}` }, 500);
    }

    // Generate signed URL (valid for 1 year)
    const { data: signedUrlData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 31536000);

    // Update test with video info
    const test = await kv.get(`test:${testId}`);
    if (!test) {
      return c.json({ error: "Test not found" }, 404);
    }

    const existingVideos = Array.isArray(test.videos) ? test.videos : [];
    const nextVideo = {
      fileName,
      url: signedUrlData?.signedUrl,
      size: file.size,
      type: file.type,
      uploadedAt: now
    };

    await kv.set(`test:${testId}`, {
      ...test,
      videos: [...existingVideos, nextVideo],
      videoFileName: fileName,
      videoUrl: signedUrlData?.signedUrl,
      videoUploadedAt: now,
      status: 'completed',
      updatedAt: now
    });

    await supabase.from('test_videos').insert({
      test_id: testId,
      file_name: fileName,
      url: signedUrlData?.signedUrl,
      size: file.size,
      type: file.type,
      uploaded_at: now
    });

    await supabase.from('tests').update({
      latest_video_file_name: fileName,
      latest_video_url: signedUrlData?.signedUrl,
      video_uploaded_at: now,
      status: 'completed',
      updated_at: now
    }).eq('test_id', testId);

    return c.json({ 
      success: true, 
      fileName,
      signedUrl: signedUrlData?.signedUrl 
    });
  } catch (error) {
    console.log(`Error uploading video: ${error}`);
    return c.json({ error: `Failed to upload video: ${error}` }, 500);
  }
});

// Delete test
app.delete("/make-server-54e4d920/tests/:testId", async (c) => {
  try {
    const testId = c.req.param('testId');
    const test = await kv.get(`test:${testId}`);
    
    if (!test) {
      return c.json({ error: "Test not found" }, 404);
    }

    // Delete videos from storage if exist
    const filesToDelete = new Set<string>();
    if (test.videoFileName) {
      filesToDelete.add(test.videoFileName);
    }
    if (Array.isArray(test.videos)) {
      test.videos.forEach((video: { fileName?: string }) => {
        if (video?.fileName) {
          filesToDelete.add(video.fileName);
        }
      });
    }
    if (filesToDelete.size > 0) {
      await supabase.storage
        .from(BUCKET_NAME)
        .remove(Array.from(filesToDelete));
    }

    // Delete test metadata
    await kv.del(`test:${testId}`);

    await supabase.from('tests').delete().eq('test_id', testId);
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting test: ${error}`);
    return c.json({ error: `Failed to delete test: ${error}` }, 500);
  }
});

Deno.serve(app.fetch);
