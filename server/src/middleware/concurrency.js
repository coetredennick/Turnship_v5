/**
 * Optimistic Concurrency and Idempotency Middleware
 * 
 * Prevents race conditions and duplicate operations through:
 * - Version-based optimistic locking
 * - Idempotency key deduplication
 * - Request fingerprinting
 */

const crypto = require('crypto');
const { prisma } = require('../db/prisma');

// Middleware for optimistic concurrency control
function optimisticLocking(req, res, next) {
  // Only apply to state-changing operations on connections
  if (!req.path.includes('/connections/') || req.method === 'GET') {
    return next();
  }

  // Store original update/patch methods to wrap them
  const originalSend = res.send;
  res.send = function(data) {
    // If this was a version conflict, add retry headers
    if (res.statusCode === 409) {
      res.set('Retry-After', '1'); // Suggest 1 second retry
      res.set('X-Conflict-Type', 'version');
      res.set('X-Conflict-Resolution', 'retry-with-latest-version');
    }
    return originalSend.call(this, data);
  };

  next();
}

// Enhanced version check for connection updates
async function checkConnectionVersion(connectionId, expectedVersion) {
  const connection = await prisma.connection.findUnique({
    where: { id: connectionId },
    select: { version: true }
  });

  if (!connection) {
    throw new Error('Connection not found');
  }

  if (connection.version !== expectedVersion) {
    const error = new Error('Version conflict - connection was modified by another request');
    error.statusCode = 409;
    error.code = 'VERSION_CONFLICT';
    error.currentVersion = connection.version;
    error.expectedVersion = expectedVersion;
    throw error;
  }

  return connection;
}

// Increment version atomically during updates
function withVersionIncrement(updateData) {
  return {
    ...updateData,
    version: { increment: 1 },
    updatedAt: new Date()
  };
}

// Middleware for idempotency key handling
function idempotencyMiddleware(requiredForEndpoints = []) {
  return async (req, res, next) => {
    const userId = req.session?.user?.id;
    const idempotencyKey = req.headers['idempotency-key'];
    const endpoint = `${req.method} ${req.path}`;
    
    // Check if idempotency is required for this endpoint
    const isRequired = requiredForEndpoints.some(pattern => 
      endpoint.match(new RegExp(pattern))
    );

    if (isRequired && !idempotencyKey) {
      return res.status(400).json({
        error: 'Idempotency key required',
        message: 'This endpoint requires an Idempotency-Key header to prevent duplicate operations',
        header: 'Idempotency-Key',
        example: 'Idempotency-Key: ' + crypto.randomUUID()
      });
    }

    if (!idempotencyKey || !userId) {
      return next();
    }

    try {
      // Create request hash for verification
      const requestHash = crypto
        .createHash('sha256')
        .update(JSON.stringify({
          method: req.method,
          path: req.path,
          body: req.body,
          userId
        }))
        .digest('hex');

      // Check for existing idempotency key
      const existing = await prisma.idempotencyKey.findUnique({
        where: { key: idempotencyKey }
      });

      if (existing) {
        // Verify the request matches
        if (existing.requestHash !== requestHash) {
          return res.status(400).json({
            error: 'Idempotency key conflict',
            message: 'This idempotency key was used for a different request',
            keyUsed: idempotencyKey,
            originalEndpoint: existing.endpoint,
            currentEndpoint: endpoint
          });
        }

        // Return cached response
        console.log(`Idempotency: Returning cached response for key ${idempotencyKey}`);
        return res.status(existing.statusCode).json(existing.responseData);
      }

      // Store idempotency info for this request
      req.idempotency = {
        key: idempotencyKey,
        requestHash,
        endpoint,
        userId
      };

      // Wrap response to cache the result
      const originalJson = res.json;
      res.json = async function(data) {
        try {
          // Cache the response
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour TTL

          await prisma.idempotencyKey.create({
            data: {
              key: idempotencyKey,
              userId,
              endpoint,
              requestHash,
              responseData: data,
              statusCode: res.statusCode,
              expiresAt
            }
          });

          console.log(`Idempotency: Cached response for key ${idempotencyKey}`);
        } catch (error) {
          console.error('Failed to cache idempotency response:', error);
          // Don't fail the request if caching fails
        }

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Idempotency middleware error:', error);
      // Don't fail the request if idempotency fails
      next();
    }
  };
}

// Cleanup expired idempotency keys (run as a background job)
async function cleanupExpiredIdempotencyKeys() {
  try {
    const result = await prisma.idempotencyKey.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });
    
    console.log(`Cleaned up ${result.count} expired idempotency keys`);
    return result.count;
  } catch (error) {
    console.error('Failed to cleanup idempotency keys:', error);
    return 0;
  }
}

module.exports = {
  optimisticLocking,
  checkConnectionVersion,
  withVersionIncrement,
  idempotencyMiddleware,
  cleanupExpiredIdempotencyKeys
};