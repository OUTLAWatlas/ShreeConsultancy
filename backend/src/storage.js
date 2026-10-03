// S3-compatible object storage.
//
// Works unchanged against AWS S3 or Cloudflare R2 — R2 deliberately speaks
// the same API, so only STORAGE_ENDPOINT/STORAGE_REGION differ between the
// two (see .env.example).
//
// Every function here throws a plain, specific error when the env vars
// aren't set, rather than failing obscurely deep inside the SDK. That is
// deliberate: storage is an optional feature. With STORAGE_* blank the rest
// of the app works normally — PDFs still generate and download in the
// browser, email still sends — you just can't upload or re-attach files.
// Callers surface that as a message instead of a crash.
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const BUCKET = process.env.STORAGE_BUCKET;

function isStorageConfigured() {
  return Boolean(
    process.env.STORAGE_ACCESS_KEY_ID && process.env.STORAGE_SECRET_ACCESS_KEY && BUCKET
  );
}

let cachedClient = null;

function getClient() {
  if (!isStorageConfigured()) {
    const err = new Error(
      'Object storage is not configured — set STORAGE_ENDPOINT, STORAGE_BUCKET, ' +
        'STORAGE_ACCESS_KEY_ID and STORAGE_SECRET_ACCESS_KEY in backend/.env.'
    );
    err.statusCode = 503;
    throw err;
  }
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: process.env.STORAGE_REGION || 'auto', // 'auto' is correct for R2
      endpoint: process.env.STORAGE_ENDPOINT || undefined, // omit for real AWS S3
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
      },
    });
  }
  return cachedClient;
}

// Object keys are built from untrusted filenames, so reduce one to a plain
// basename before anything else — a browser can send "../../etc/passwd",
// and while S3 keys are flat strings (so slashes alone can't traverse), it
// costs nothing to never let those segments into the key at all.
function safeKeySegment(filename) {
  const base = String(filename).split(/[\\/]/).pop() || '';
  const cleaned = base
    .replace(/[^\w.\- ]+/g, '_') // anything exotic becomes an underscore
    .replace(/\.{2,}/g, '.') // collapse dot runs, so no ".." survives
    .replace(/^[.\-]+/, '') // no leading dot (hidden files) or dash
    .replace(/\s+/g, '-')
    .slice(0, 120);
  return cleaned || 'file';
}

function buildKey(projectId, filename) {
  return `projects/${projectId}/${Date.now()}-${safeKeySegment(filename)}`;
}

async function uploadBuffer(key, buffer, contentType) {
  await getClient().send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType })
  );
  return key;
}

// The bucket stays private — downloads go through a time-limited signed
// URL rather than a public bucket policy.
async function getDownloadUrl(key, expiresIn = 3600) {
  return getSignedUrl(getClient(), new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
    expiresIn,
  });
}

async function deleteObject(key) {
  await getClient().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

module.exports = { uploadBuffer, getDownloadUrl, deleteObject, buildKey, isStorageConfigured };
