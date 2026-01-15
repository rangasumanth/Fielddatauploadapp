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

    if (!test) {
      return c.json({ error: "Test not found" }, 404);
    }

    const now = new Date().toISOString();
    const merged = {
      ...test,
      ...updates,
      testId,
      metadata: updates.metadata ?? test.metadata,
      updatedAt: now
    };

    await kv.set(`test:${testId}`, merged);
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
    const test = await kv.get(`test:${testId}`);
    
    if (!test) {
      return c.json({ error: "Test not found" }, 404);
    }
    
    return c.json(test);
  } catch (error) {
    console.log(`Error retrieving test: ${error}`);
    return c.json({ error: `Failed to retrieve test: ${error}` }, 500);
  }
});

// Get all tests
app.get("/make-server-54e4d920/tests", async (c) => {
  try {
    const tests = await kv.getByPrefix('test:');
    
    // Sort by createdAt descending
    const sortedTests = tests.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
    
    return c.json({ tests: sortedTests });
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
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting test: ${error}`);
    return c.json({ error: `Failed to delete test: ${error}` }, 500);
  }
});

Deno.serve(app.fetch);
