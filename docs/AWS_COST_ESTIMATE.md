# AWS Cost Estimate for YNAB Mobile App

## Assumptions
- **Users:** 1-5 (you and family members)
- **Transactions:** ~400/month based on your current data
- **Receipt uploads:** ~50-100/month
- **YNAB sync frequency:** Every 15 minutes
- **Active app usage:** ~30 minutes/day per user

---

## Monthly Cost Breakdown

### 1. AWS Lambda (Transaction Sync & API)

**YNAB Sync Function:**
- Runs every 15 minutes = 2,880 invocations/month
- Average duration: 3 seconds
- Memory: 512 MB

**API Functions:**
- User requests: ~1,000 invocations/month
- Average duration: 1 second
- Memory: 256 MB

**Cost Calculation:**
- Free Tier: 1M requests/month, 400,000 GB-seconds/month
- Your usage: ~4,000 requests, ~12,000 GB-seconds
- **Cost: $0.00** (well within free tier)

---

### 2. API Gateway

**Requests:**
- YNAB sync calls: 2,880/month
- Mobile app API calls: ~5,000/month
- Total: ~8,000 requests/month

**Cost Calculation:**
- Free Tier: 1M requests/month for 12 months
- After free tier: $3.50 per million requests
- **Cost: $0.00** (free tier) or **$0.03/month** (after free tier)

---

### 3. DynamoDB

**Tables:**
- Transactions (enhanced metadata)
- Receipts
- User tags/preferences
- Budget snapshots

**Storage:**
- Transactions: ~400 records × 5 KB = 2 MB
- Receipts metadata: ~100 records × 10 KB = 1 MB
- Total: ~5-10 MB

**Read/Write:**
- Reads: ~10,000/month
- Writes: ~3,000/month

**Cost Calculation:**
- Free Tier: 25 GB storage, 25 WCU, 25 RCU
- Your usage: <1 GB, <1 WCU, <1 RCU
- **Cost: $0.00** (well within free tier)

---

### 4. S3 (Receipt Storage)

**Storage:**
- 100 receipts/month × 2 MB average = 200 MB/month
- Annual accumulation: ~2.4 GB

**Requests:**
- PUT (uploads): ~100/month
- GET (views): ~500/month

**Data Transfer:**
- Out to internet: ~1 GB/month (viewing receipts)

**Cost Calculation:**
- Storage: 2.4 GB × $0.023/GB = $0.06/month
- PUT requests: 100 × $0.005/1000 = $0.0005
- GET requests: 500 × $0.0004/1000 = $0.0002
- Data transfer: 1 GB free, then $0.09/GB
- **Cost: $0.06-$0.15/month**

---

### 5. AWS Textract (OCR for Receipts)

**Usage:**
- 50-100 receipts/month
- Average 1 page per receipt

**Cost Calculation:**
- First 1,000 pages: FREE (first 3 months)
- After: $1.50 per 1,000 pages
- Your usage: 100 pages/month = $0.15/month
- **Cost: $0.00** (first 3 months) then **$0.15/month**

---

### 6. SNS (Push Notifications)

**Notifications:**
- New transaction alerts: ~400/month
- Budget alerts: ~50/month
- Total: ~500/month

**Cost Calculation:**
- First 1M notifications: FREE
- Mobile push notifications: $0.50 per million
- **Cost: $0.00**

---

### 7. CloudWatch Logs

**Log Storage:**
- Lambda logs: ~100 MB/month
- Retention: 7 days

**Cost Calculation:**
- Free Tier: 5 GB ingestion
- **Cost: $0.00**

---

### 8. Expo Push Notifications

**Usage:**
- Same as SNS: ~500 notifications/month

**Cost Calculation:**
- **Cost: $0.00** (Expo push is free)

---

## Total Monthly Cost Estimate

| Service | First Year (Free Tier) | After Free Tier |
|---------|------------------------|-----------------|
| Lambda | $0.00 | $0.00 |
| API Gateway | $0.00 | $0.03 |
| DynamoDB | $0.00 | $0.00 |
| S3 | $0.06 | $0.15 |
| Textract | $0.00 (3mo) | $0.15 |
| SNS | $0.00 | $0.00 |
| CloudWatch | $0.00 | $0.00 |
| Expo | $0.00 | $0.00 |
| **TOTAL** | **~$0.06/month** | **~$0.33/month** |

---

## Annual Cost Estimate

- **First Year:** ~$0.72 - $2.00
- **Subsequent Years:** ~$4.00 - $6.00

---

## Cost Optimization Tips

1. **S3 Intelligent-Tiering:** Automatically moves old receipts to cheaper storage
   - Saves ~50% on storage after 30 days

2. **DynamoDB On-Demand:** Only pay for what you use (already assumed)

3. **Receipt Compression:** Compress images before upload
   - Could reduce S3 costs by 60-70%

4. **CloudWatch Log Retention:** Keep logs for 7 days instead of indefinitely
   - Already assumed

5. **Textract Alternatives:**
   - Use free tier of Google Cloud Vision (1,000 images/month free forever)
   - **Potential savings: $1.80/year**

---

## Scaling Costs

If you later wanted to offer this to other users:

| Users | Monthly Cost | Annual Cost |
|-------|--------------|-------------|
| 1-5 | $0.33 | $4.00 |
| 10 | $0.50 | $6.00 |
| 50 | $2.00 | $24.00 |
| 100 | $5.00 | $60.00 |
| 500 | $25.00 | $300.00 |

---

## Summary

**Bottom Line:**
- **First year cost: Less than $2/month** (most months will be $0.06)
- **After free tier expires: $0.33/month** (~$4/year)
- **This is incredibly cheap** for a fully-featured personal finance app!

**For comparison:**
- YNAB subscription: $14.99/month ($180/year)
- Mint Plus: $4.99/month ($60/year)
- Your custom app: **$0.33/month ($4/year)**

You'll spend more on coffee in a single day than this app costs to run for a year!

---

## One-Time Setup Costs

- **AWS Account:** FREE
- **Expo Development:** FREE
- **Development Tools:** FREE
- **Domain (optional):** ~$12/year
- **SSL Certificate:** FREE (AWS ACM)

**Total one-time cost: $0** (or ~$12 if you want a custom domain)

---

## Recommendations

✅ **Proceed with the build** - costs are negligible
✅ Start with all AWS services (stay in free tier)
✅ Monitor costs in AWS Cost Explorer
✅ Set up billing alerts at $1, $5, $10 thresholds
✅ Consider switching Textract to Google Vision API for permanent free tier

---

## AWS Free Tier Benefits (First 12 Months)

Many services have "Always Free" tiers that never expire:
- Lambda: 1M requests/month forever
- DynamoDB: 25 GB storage forever
- SNS: 1M publishes/month forever
- CloudWatch: 5 GB logs forever

Your app will likely stay within the "Always Free" tier indefinitely!
