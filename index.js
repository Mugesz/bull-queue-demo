const redis = require("redis");
const Bull = require("bull");
const dotenv = require("dotenv");
dotenv.config();

const redisOptions = {
  redis: {
    host: "192.168.1.5",
    port: "6379",
    password: "12345",
  },
};

const redisClient = redis.createClient(redisOptions);
(async () => {
  await redisClient.connect();
})();

redisClient.on("ready", () => {
  console.log("Connected!");
});

redisClient.on("error", (err) => {
  console.error(err);
});

const myQueue = new Bull("my-queue", redisOptions);

async function processJob(job) {
  console.log(`Processing job ${job.id}`);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  if (Math.random() < 0.2) {
    throw new Error("Job failed randomly");
  }
  return `Job ${job.id} completed successfully`;
}

// add job
async function addJobsToQueue(numJobs) {
  for (let i = 0; i < numJobs; i++) {
    await myQueue.add({ jobNumber: i });
    console.log(`Job ${i} added to the queue`);
  }
}

// process a job
myQueue.process(async (job) => {
  try {
    const result = await processJob(job);
    return result;
  } catch (error) {
    console.error(`Error processing job ${job.id}:`, error.message);
    throw error;
  }
});

addJobsToQueue(5);

// Pausing the queue
async function pauseQueue() {
  await myQueue.pause();
  console.log("Queue paused");
}

// // Resuming the queue
async function resumeQueue() {
  await myQueue.resume();
  console.log("Queue resumed");
}

//get job
async function getAllJob() {
  const job = await myQueue.getJob();
  console.log("Fetched job:", job);
}

// fetch job
async function fetchJob(jobId) {
  const job = await myQueue.getJob(jobId);
  console.log("Fetched job:", job);
}

// update  job
async function updatejob(jobId) {
  const job = await myQueue.getJob(jobId);
  if (job) {
    await job.update(data);
    console.log("job updated sucessfully");
  }
}

// clean job
async function cleanJobs() {
  await myQueue.clean(1, "completed");
  await myQueue.clean(0, "failed");
  console.log("Completed and failed jobs cleaned up");
}

// remove
async function deletejob(jobId) {
  const job = await myQueue.getJob(jobId);
  await job.remove();
  console.log("job remove sucessfully ");
}

// completed
myQueue.on("completed", (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result);
});

// failed
myQueue.on("failed", (job, error) => {
  console.error(`Job ${job.id} failed with error:`, error);
});

// getAllJob()
// pauseQueue()
// resumeQueue()
// fetchJob(1)
// cleanJobs();
//deletejob(1)
// updateJob(1, { status: "in progress" });
