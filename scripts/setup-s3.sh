#!/usr/bin/env bash
#############################################################
# AWS S3 Bucket Setup Script
# Creates the bucket with proper configuration.
# Requires AWS CLI configured with appropriate permissions.
#############################################################

set -euo pipefail

BUCKET_NAME="${S3_BUCKET_NAME:-master-dashboard-storage}"
REGION="${AWS_REGION:-us-east-1}"

echo "Creating S3 bucket: $BUCKET_NAME in $REGION"

# Create bucket
if [ "$REGION" = "us-east-1" ]; then
  aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION"
else
  aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION"
fi

# Enable versioning
aws s3api put-bucket-versioning --bucket "$BUCKET_NAME" \
  --versioning-configuration Status=Enabled

# Block public access
aws s3api put-public-access-block --bucket "$BUCKET_NAME" \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Lifecycle rule — auto-delete temp files after 7 days
aws s3api put-bucket-lifecycle-configuration --bucket "$BUCKET_NAME" \
  --lifecycle-configuration '{
    "Rules": [
      {
        "ID": "CleanupTemp",
        "Filter": { "Prefix": "temp/" },
        "Status": "Enabled",
        "Expiration": { "Days": 7 }
      },
      {
        "ID": "CleanupOldLogs",
        "Filter": { "Prefix": "logs/" },
        "Status": "Enabled",
        "Expiration": { "Days": 90 }
      }
    ]
  }'

# Enable server-side encryption
aws s3api put-bucket-encryption --bucket "$BUCKET_NAME" \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        },
        "BucketKeyEnabled": true
      }
    ]
  }'

echo ""
echo "S3 bucket '$BUCKET_NAME' created successfully with:"
echo "  ✓ Versioning enabled"
echo "  ✓ Public access blocked"
echo "  ✓ Temp cleanup (7 days)"
echo "  ✓ Log cleanup (90 days)"
echo "  ✓ Server-side encryption (AES256)"
