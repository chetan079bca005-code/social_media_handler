# Social Media API Integration Guide
<!-- ## Complete Step-by-Step Guide to Connect, Post & Analyze -->

---

<!-- ## Table of Contents
1. [Overview](#overview)
2. [Facebook API](#facebook-api)
3. [Instagram API](#instagram-api)
4. [Twitter/X API](#twitter-api)
5. [LinkedIn API](#linkedin-api)
6. [TikTok API](#tiktok-api)
7. [YouTube API](#youtube-api)
8. [Comparison Chart](#comparison-chart)
9. [Implementation Steps](#implementation-steps)
10. [Best Practices](#best-practices) -->

---
<!-- 
## Overview

This guide covers how to integrate social media APIs with your Social Media Handler platform to:
- ✅ Authenticate with social platforms 
- ✅ Post content directly
- ✅ Upload media files
- ✅ Retrieve analytics and metrics
- ✅ Schedule posts
- ✅ Manage comments and engagement -->

---

# 1. FACEBOOK API

## Overview
- **Free Tier:** Yes, limited
- **Authentication:** OAuth 2.0
- **Best For:** Reaching mature demographics and community building
- **Cost:** Free with limits, paid for advanced features

## Get Free API Access

### Step 1: Create Facebook Developer Account
```
1. Go to https://developers.facebook.com/
2. Click "Get Started"
3. Sign in with your Facebook account
4. Accept the developer agreement
5. Verify your account via email
```

### Step 2: Create an App
```
1. Click "Create App" in the top right
2. Choose "Business" as app type
3. Fill in app details:
   - App Name: "Social Media Handler"
   - App Contact Email: your-email@gmail.com
   - App Purpose: "Create a business app"
4. Click "Create App"
5. Complete security check
```

### Step 3: Add Products
```
1. In App Dashboard, click "Add Product"
2. Find "Facebook Login" → Click "Set Up"
3. Choose "Web" as platform
4. Complete the setup wizard
5. Add "Facebook App ID" and "App Secret" to your .env
```

### Step 4: Get Access Token
```
1. Go to Tools → Graph API Explorer
2. Select your app from dropdown
3. Choose "Get Token" → "App Token"
4. Copy the access token
5. This token is valid for 60 days
```

### Step 5: Add Required Permissions
In App Roles section, add:
- `pages_manage_posts` - Post on pages
- `pages_read_analytics` - Read page analytics
- `pages_manage_metadata` - Manage page settings
- `instagram_basic` - Access Instagram basic info
- `instagram_manage_insights` - Get Instagram analytics

---

## Facebook API Endpoints

### Authentication Flow
```
OAuth Endpoint: https://www.facebook.com/v18.0/dialog/oauth
Token Endpoint: https://graph.facebook.com/v18.0/oauth/access_token
```

### Create a Post
```bash
POST https://graph.facebook.com/v18.0/{PAGE_ID}/feed
Parameters:
  - access_token: YOUR_ACCESS_TOKEN
  - message: "Your post content here"
  - link: "https://example.com" (optional)
  - picture: "image_url" (optional)

Example using cURL:
curl -X POST "https://graph.facebook.com/v18.0/YOUR_PAGE_ID/feed" \
  -d "message=Hello%20World" \
  -d "access_token=YOUR_ACCESS_TOKEN"
```

### Create Post with Image
```bash
POST https://graph.facebook.com/v18.0/{PAGE_ID}/photos

Parameters:
  - access_token: YOUR_ACCESS_TOKEN
  - source: IMAGE_FILE_BINARY
  - message: "Photo caption"
  - published: true (to publish immediately)

Example in Node.js:
const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('source', fs.createReadStream('image.jpg'));
form.append('message', 'Check out this photo!');
form.append('access_token', accessToken);

axios.post(`https://graph.facebook.com/v18.0/${pageId}/photos`, form, {
  headers: form.getHeaders()
});
```

### Get Page Analytics
```bash
GET https://graph.facebook.com/v18.0/{PAGE_ID}/insights

Parameters:
  - metric: PAGE_FANS,PAGE_FANS_CITY,PAGE_IMPRESSIONS
  - period: day,week,month
  - access_token: YOUR_ACCESS_TOKEN

Example:
curl "https://graph.facebook.com/v18.0/YOUR_PAGE_ID/insights?metric=PAGE_IMPRESSIONS&period=day&access_token=YOUR_ACCESS_TOKEN"
```

### Get Post Analytics
```bash
GET https://graph.facebook.com/v18.0/{POST_ID}/insights

Metrics available:
  - post_impressions: Total views
  - post_engaged_users: People who interacted
  - post_clicks: Total clicks
  - post_reactions_by_type_total: Reaction breakdown
```

### Schedule a Post
```bash
POST https://graph.facebook.com/v18.0/{PAGE_ID}/feed

Parameters:
  - access_token: YOUR_ACCESS_TOKEN
  - message: "Scheduled post"
  - scheduled_publish_time: UNIX_TIMESTAMP (future time)
  - published: false

Example:
const futureTime = Math.floor(Date.now() / 1000) + (24 * 3600); // 24 hours from now
curl -X POST "https://graph.facebook.com/v18.0/PAGE_ID/feed" \
  -d "message=Hello" \
  -d "scheduled_publish_time=$futureTime" \
  -d "published=false" \
  -d "access_token=TOKEN"
```

## Facebook API Limits (Free Tier)

| Feature | Limit |
|---------|-------|
| API Calls | 200 calls per hour per token |
| Page Posts | 10 posts per hour per page |
| Image Size | 1200x628 pixels recommended |
| Video Size | Up to 4GB |
| Video Duration | Up to 45 minutes |
| Subscriptions | Unlimited |
| Analytics | Only last 2 years |

---

# 2. INSTAGRAM API

## Overview
- **Free Tier:** Yes, limited (requires Facebook Business Account)
- **Authentication:** OAuth 2.0 (via Facebook)
- **Best For:** Visual content, younger audience
- **Cost:** Free with limitations

## Get Free API Access

### Step 1: Prerequisites
```
✓ Facebook Business Account (free)
✓ Instagram Business Account (free)
✓ Facebook App (from Facebook API section above)
```

### Step 2: Convert to Business Account
```
1. Go to Instagram Settings → Account
2. Click "Switch to Professional Account"
3. Select "Business"
4. Complete the business information
```

### Step 3: Add Instagram to Your App
```
1. In Facebook App Dashboard
2. Products → Add Product
3. Search "Instagram Graph API"
4. Click "Set Up"
5. Follow the setup wizard
```

### Step 4: Get Required Permissions
```
Required scopes:
- instagram_basic
- instagram_content_publish
- instagram_manage_insights
- pages_read_user_content
- pages_manage_metadata
```

### Step 5: Get Instagram Account ID
```bash
GET https://graph.instagram.com/me/accounts
Parameters:
  - fields: id,username,name
  - access_token: YOUR_ACCESS_TOKEN

Response:
{
  "data": [
    {
      "instagram_business_account": {
        "id": "INSTAGRAM_BUSINESS_ACCOUNT_ID",
        "username": "your_username"
      },
      "id": "INSTAGRAM_ACCOUNT_ID"
    }
  ]
}
```

---

## Instagram API Endpoints

### Create a Post (Carousel)
```bash
POST https://graph.instagram.com/v18.0/{IG_USER_ID}/media

Parameters:
  - access_token
  - media_type: "CAROUSEL"
  - items: [
      {
        "media_type": "IMAGE",
        "image_url": "https://..."
      },
      {
        "media_type": "IMAGE", 
        "image_url": "https://..."
      }
    ]
  - caption: "Your caption"

Example Node.js:
const instagramService = {
  createPost: async (userId, images, caption, token) => {
    const items = images.map(url => ({
      media_type: 'IMAGE',
      image_url: url
    }));

    const response = await axios.post(
      `https://graph.instagram.com/v18.0/${userId}/media`,
      {
        media_type: 'CAROUSEL',
        items,
        caption
      },
      {
        params: { access_token: token }
      }
    );
    return response.data;
  }
};
```

### Create a Single Image Post
```bash
POST https://graph.instagram.com/v18.0/{IG_USER_ID}/media

Parameters:
  - media_type: "IMAGE"
  - image_url: "https://example.com/image.jpg"
  - caption: "Post caption with #hashtags"
  - access_token: TOKEN
```

### Create a Video Post
```bash
POST https://graph.instagram.com/v18.0/{IG_USER_ID}/media

Parameters:
  - media_type: "VIDEO" or "REELS"
  - video_url: "https://example.com/video.mp4"
  - caption: "Video description"
  - thumbnail_url: "https://example.com/thumb.jpg" (optional)
  - access_token: TOKEN
```

### Publish a Post
```bash
POST https://graph.instagram.com/v18.0/{MEDIA_CREATION_ID}/publish

Parameters:
  - access_token: TOKEN

Returns media_id of published post
```

### Get Post Insights
```bash
GET https://graph.instagram.com/v18.0/{MEDIA_ID}/insights

Parameters:
  - metric: IMPRESSIONS,REACH,PROFILE_VISITS,ENGAGEMENT,SAVED,ACTIONS_ON_PROFILE
  - access_token: TOKEN

Response:
{
  "data": [
    {
      "name": "impressions",
      "period": "lifetime",
      "values": [
        {
          "value": 12345
        }
      ],
      "title": "Impressions",
      "description": "Total number of times the IG User's media has been seen"
    }
  ]
}
```

### Get Account Insights
```bash
GET https://graph.instagram.com/v18.0/{IG_USER_ID}/insights

Parameters:
  - metric: IMPRESSIONS,REACH,PROFILE_VISITS,FOLLOWER_COUNT,WEBSITE_CLICKS
  - period: day,week,month,lifetime
  - access_token: TOKEN
```

### Get Media Information
```bash
GET https://graph.instagram.com/v18.0/{MEDIA_ID}

Fields:
  - id, media_type, media_url, timestamp
  - caption, like_count, comments_count
  - insights

Parameters:
  - fields: id,media_type,caption,like_count,comments_count,timestamp
  - access_token: TOKEN
```

## Instagram API Limits (Free Tier)

| Feature | Limit |
|---------|-------|
| API Calls | 200 calls per hour |
| Posts per day | 100 |
| Video Duration | Up to 60 minutes (Reels up to 90 sec) |
| Image Size | 1080x1350 or 1200x628 |
| Media Size | Up to 8GB |
| Comments | Can read, limited on creation |
| DMs | Read only (no bot replies) |

---

# 3. TWITTER/X API

## Overview
- **Free Tier:** Limited (requires paid subscription for some features)
- **Authentication:** OAuth 2.0
- **Best For:** Real-time news, trending topics, engagement
- **Cost:** Free tier available, paid tiers for higher limits

## Get Free API Access

### Step 1: Create Twitter Developer Account
```
1. Go to https://developer.twitter.com/
2. Click "Sign Up For Free" 
3. Fill in developer information
4. Agree to terms and policies
5. Provide use case details
6. Wait for approval (usually 24-48 hours)
```

### Step 2: Create an App
```
1. Go to Developer Portal
2. Projects & Apps → Create App
3. Choose appropriate environment:
   - Sandbox (FREE - limited requests)
   - Production (Requires approval)
4. Name your app: "Social Media Handler"
5. Click "Create"
```

### Step 3: Get API Keys
```
1. Go to App Settings
2. Keys and Tokens tab
3. Generate:
   - API Key (Consumer Key)
   - API Secret Key (Consumer Secret)
   - Bearer Token
4. Save in .env file:
   - TWITTER_API_KEY=xxx
   - TWITTER_API_SECRET=xxx
   - TWITTER_BEARER_TOKEN=xxx
```

### Step 4: Set Permissions
For OAuth 2.0 Apps:
```
1. Click User Authentication Settings
2. Select "Read and write"
3. Set Callback URL: http://localhost:5000/auth/twitter/callback
4. Set Website URL: https://yourdomain.com
5. Save changes
```

---

## Twitter API Endpoints (v2)

### Post a Tweet
```bash
POST https://api.twitter.com/2/tweets

Headers:
  - Authorization: Bearer YOUR_BEARER_TOKEN
  - Content-Type: application/json

Body:
{
  "text": "Your tweet text here! #hashtag"
}

Example Node.js:
const axios = require('axios');

const postTweet = async (text, bearerToken) => {
  try {
    const response = await axios.post(
      'https://api.twitter.com/2/tweets',
      { text },
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error posting tweet:', error.response.data);
  }
};

// Usage:
postTweet("Hello World! 🚀", process.env.TWITTER_BEARER_TOKEN);
```

### Post a Tweet with Media
```bash
POST https://api.twitter.com/2/tweets

First, upload media:
POST https://upload.twitter.com/1.1/media/upload.json

Parameters:
  - media_data: BASE64_ENCODED_IMAGE

Then post tweet with media_ids:
{
  "text": "Check out this image!",
  "reply_settings": "everyone",
  "media": {
    "media_ids": ["MEDIA_ID_1", "MEDIA_ID_2"]
  }
}

Example (Node.js):
const FormData = require('form-data');
const fs = require('fs');

const uploadMedia = async (imagePath, token) => {
  const form = new FormData();
  form.append('media_data', fs.readFileSync(imagePath), { filename: 'image.jpg' });
  
  const config = {
    method: 'post',
    url: 'https://upload.twitter.com/1.1/media/upload.json',
    headers: {
      'Authorization': `Bearer ${token}`,
      ...form.getHeaders()
    },
    data: form
  };
  
  const response = await axios(config);
  return response.data.media_id_string;
};
```

### Get Tweet Metrics
```bash
GET https://api.twitter.com/2/tweets

Parameters:
  - ids: TWEET_ID
  - tweet.fields: public_metrics,author_id,created_at
  - expansions: author_id
  - user.fields: username,public_metrics

Response:
{
  "data": [
    {
      "public_metrics": {
        "retweet_count": 5,
        "reply_count": 2,
        "like_count": 42,
        "quote_count": 1,
        "bookmark_count": 3,
        "impression_count": 500
      },
      "id": "1234567890",
      "text": "Your tweet"
    }
  ]
}
```

### Search Recent Tweets
```bash
GET https://api.twitter.com/2/tweets/search/recent

Parameters:
  - query: "your search query OR #hashtag"
  - max_results: 100 (max)
  - tweet.fields: public_metrics,created_at,author_id

Example:
curl "https://api.twitter.com/2/tweets/search/recent?query=social%20media%20handler&max_results=10&tweet.fields=public_metrics" \
  -H "Authorization: Bearer YOUR_BEARER_TOKEN"
```

### Get User Information
```bash
GET https://api.twitter.com/2/users/by/username/{USERNAME}

Parameters:
  - user.fields: public_metrics,created_at,description
  - tweet.fields: (if including latest tweets)

Response includes follower_count, following_count, etc.
```

## Twitter API Limits (Free Tier)

| Feature | Limit | Tier |
|---------|-------|------|
| Tweets per month | 10,000 | FREE |
| API Calls | 300 per 15 min | FREE |
| Search lookback | 7 days | FREE |
| Hashtag Search | 300 per 15 min | FREE |
| Video Size | Up to 512MB | ALL |
| Tweet Length | 280 characters | ALL |
| Media per tweet | 4 images / 1 video | ALL |

**Note:** To post tweets, you need "Read and Write" access which requires elevated access approval from Twitter.

---

# 4. LINKEDIN API

## Overview
- **Free Tier:** Limited (requires LinkedIn Premium for some features)
- **Authentication:** OAuth 2.0
- **Best For:** Business content, professional networking, B2B
- **Cost:** Free API, some features require LinkedIn Premium

## Get Free API Access

### Step 1: Create LinkedIn Developer App
```
1. Go to https://www.linkedin.com/developers/apps
2. Click "Create app"
3. Fill in required information:
   - App name: "Social Media Handler"
   - LinkedIn Page: Link your business page
   - App logo: Upload a logo
   - Legal agreement: Accept terms
4. Create the app
```

### Step 2: Get Credentials
```
1. Go to Auth tab
2. Copy:
   - Client ID
   - Client Secret
3. Save in .env:
   - LINKEDIN_CLIENT_ID=xxx
   - LINKEDIN_CLIENT_SECRET=xxx
```

### Step 3: Configure OAuth Settings
```
1. Go to Auth tab
2. Authorized redirect URLs:
   - Add: http://localhost:5000/auth/linkedin/callback
   - Add: https://yourdomain.com/auth/linkedin/callback
3. Save
```

### Step 4: Request Access
```
1. Go to Products tab
2. Request access to:
   - Sign In with LinkedIn
   - Share on LinkedIn
   - Marketing Developer Platform
3. Wait for approval (usually 24-48 hours)
```

---

## LinkedIn API Endpoints

### Authenticate User (OAuth 2.0)
```bash
Step 1: Redirect to LinkedIn
https://www.linkedin.com/oauth/v2/authorization?
  response_type=code&
  client_id=YOUR_CLIENT_ID&
  redirect_uri=http://localhost:5000/auth/linkedin/callback&
  scope=r_liteprofile%20w_member_social%20r_1d_financial_accounts

Step 2: Exchange code for token
POST https://www.linkedin.com/oauth/v2/accessToken

Parameters:
  - grant_type: authorization_code
  - code: RECEIVED_CODE
  - redirect_uri: YOUR_REDIRECT_URI
  - client_id: YOUR_CLIENT_ID
  - client_secret: YOUR_CLIENT_SECRET

Returns: 
{
  "access_token": "YOUR_ACCESS_TOKEN",
  "expires_in": 5184000
}
```

### Create a Text Share
```bash
POST https://api.linkedin.com/v2/ugcPosts

Headers:
  - Authorization: Bearer ACCESS_TOKEN
  - Content-Type: application/json

Body:
{
  "author": "urn:li:person:PERSON_ID",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.PublishText": {
      "text": "Your post content here! #linkedin #socialmedia"
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}

Example Node.js:
const postOnLinkedIn = async (text, personId, accessToken) => {
  const response = await axios.post(
    'https://api.linkedin.com/v2/ugcPosts',
    {
      author: `urn:li:person:${personId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.PublishText': { text }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};
```

### Post with Image/Document
```bash
First, register the upload:
POST https://api.linkedin.com/v2/assets?action=registerUpload

Body:
{
  "registerUploadRequest": {
    "recipes": ["urn:li:digitalmediaRecipe:org-document"],
    "owner": "urn:li:organization:ORGANIZATIONAL_ENTITY_ID",
    "serviceRelationships": [
      {
        "relationshipType": "OWNER",
        "identifier": "urn:li:userGeneratedContent"
      }
    ]
  }
}

Then, upload the file and create post with asset:
{
  "author": "urn:li:person:PERSON_ID",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.PublishDocument": {
      "document": "urn:li:digitalmediaDocument:ASSET_ID"
    }
  }
}
```

### Get User Profile
```bash
GET https://api.linkedin.com/v2/me

Headers:
  - Authorization: Bearer ACCESS_TOKEN

Optional Fields:
  - localizedFirstName
  - localizedLastName
  - profilePicture(displayImage)
  - vanityName
  - urn
```

### Get Posts Metrics (Premium)
```
Note: Detailed analytics require LinkedIn Premium
Free alternative: Track via impressions logs

Available for organization pages:
GET https://api.linkedin.com/v2/organizationalEntityAcls
GET https://api.linkedin.com/v2/organizationalPosts
```

## LinkedIn API Limits (Free Tier)

| Feature | Limit |
|---------|-------|
| Posts per day | 5 |
| API Calls | 3000 per month |
| Character limit | 3000 |
| Media per post | 1 document/image |
| Video Support | Limited |
| Analytics | Basic only |

**LinkedIn Premium Required For:**
- Detailed post metrics
- Follower analytics
- Engagement insights

---

# 5. TIKTOK API

## Overview
- **Free Tier:** Limited (requires TikTok Creator Fund or Business Account)
- **Authentication:** OAuth 2.0
- **Best For:** Short-form videos, trending content, younger audience
- **Cost:** Free API with limitations

## Get Free API Access

### Step 1: Register TikTok Developer Account
```
1. Go to https://developers.tiktok.com/
2. Click "Sign Up" or "Log In"
3. Use your TikTok account (or create one)
4. Fill in developer information
5. Verify email address
```

### Step 2: Create an Application
```
1. Go to Developer Portal
2. Applications → Create Application
3. Choose platform: "Web"
4. Fill in:
   - App name: "Social Media Handler"
   - App description: Social media management
   - App category: Business
5. Create application
```

### Step 3: Get Credentials
```
1. Go to Application Settings
2. Copy:
   - Client Key
   - Client Secret
3. Save in .env:
   - TIKTOK_CLIENT_ID=xxx
   - TIKTOK_CLIENT_SECRET=xxx
```

### Step 4: Enable API Endpoints
```
1. Go to Products section
2. Request access to:
   - TikTok API
   - Video Upload API
   - Analytics API
3. Wait for approval (5-7 days)
```

### Step 5: Set OAuth Settings
```
1. OAuth Settings section
2. Add Redirect URL:
   - http://localhost:5000/auth/tiktok/callback
3. Set Scope:
   - user.info.basic
   - video.upload
   - analytics
4. Save
```

---

## TikTok API Endpoints

### Upload a Video
```bash
POST https://open.tiktokapis.com/v1/post/publish/action/upload/

Headers:
  - Authorization: Bearer ACCESS_TOKEN
  - Content-Type: application/octet-stream

Parameters:
  - upload_type: video_upload
  - video_size: FILE_SIZE_IN_BYTES

Body: Binary video file

Note: Video requirements:
- Format: MP4, MOV, AVI, WEBM
- Size: Max 287.6 MB
- Duration: 3 seconds - 10 minutes
- Resolution: 720x1280 (9:16) recommended
- Frame rate: 24-60 FPS

Example Node.js:
const fs = require('fs');
const axios = require('axios');

const uploadTikTokVideo = async (videoPath, accessToken) => {
  const videoBuffer = fs.readFileSync(videoPath);
  
  const config = {
    method: 'post',
    url: 'https://open.tiktokapis.com/v1/post/publish/action/upload/',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream'
    },
    data: videoBuffer,
    params: {
      upload_type: 'video_upload',
      video_size: videoBuffer.length
    }
  };
  
  const response = await axios(config);
  return response.data.data.upload_id;
};
```

### Create and Publish a Post
```bash
POST https://open.tiktokapis.com/v1/post/publish/

Headers:
  - Authorization: Bearer ACCESS_TOKEN
  - Content-Type: application/json

Body:
{
  "post_info": {
    "title": "Your video description",
    "description": "Check out this amazing content! #FYP #ForYou",
    "video_cover_timestamp_ms": 0
  },
  "source_info": {
    "source": "FILE_UPLOAD",
    "video_upload_id": "UPLOAD_ID_FROM_PREVIOUS_STEP"
  },
  "post_mode": "PUBLISH_TO_FEED",
  "privacy_level": "PUBLIC"
}

Response:
{
  "data": {
    "publish_id": "7123456789012345678",
    "error_code": "ok"
  }
}
```

### Get Analytics Data
```bash
GET https://open.tiktokapis.com/v1/video/query/

Parameters:
  - fields: video_id,title,create_time,view_count,like_count,comment_count,share_count
  - access_token: ACCESS_TOKEN

Response:
{
  "data": {
    "videos": [
      {
        "video_id": "7123456789",
        "title": "Video title",
        "create_time": 1609459200,
        "view_count": 1234,
        "like_count": 567,
        "comment_count": 89,
        "share_count": 23
      }
    ]
  }
}

Example Node.js:
const getTikTokAnalytics = async (accessToken) => {
  const response = await axios.get(
    'https://open.tiktokapis.com/v1/video/query/',
    {
      params: {
        fields: 'video_id,title,view_count,like_count,comment_count',
        access_token: accessToken
      }
    }
  );
  return response.data.data.videos;
};
```

### Get User Info
```bash
GET https://open.tiktokapis.com/v1/user/info/

Parameters:
  - fields: open_id,union_id,avatar_url,display_name,bio_description
  - access_token: ACCESS_TOKEN

Response:
{
  "data": {
    "user": {
      "open_id": "xxx",
      "union_id": "xxx",
      "avatar_url": "https://...",
      "display_name": "Your Username",
      "bio_description": "Your bio"
    }
  }
}
```

## TikTok API Limits (Free Tier)

| Feature | Limit |
|---------|-------|
| Videos per day | 100 videos per day |
| API Calls | 1000 per hour |
| Video Size | Max 287.6 MB |
| Video Duration | 3 sec - 10 min |
| Analytics Lookback | 30 days |
| Historical Data | Last 30 days only |

**Requires TikTok Creator Fund For:**
- Monetization
- Advanced analytics
- Higher video limits

---

# 6. YOUTUBE API

## Overview
- **Free Tier:** Yes (limited)
- **Authentication:** OAuth 2.0
- **Best For:** Long-form videos, tutorials, vlogs
- **Cost:** Free with API quota limits

## Get Free API Access

### Step 1: Create Google Cloud Project
```
1. Go to https://console.cloud.google.com/
2. Create a new project:
   - Project name: "Social Media Handler"
3. Click "Create"
```

### Step 2: Enable YouTube API v3
```
1. In Google Cloud Console
2. Go to "APIs & Services"
3. Click "Enable APIs and Services"
4. Search "YouTube Data API v3"
5. Click "Enable"
```

### Step 3: Create OAuth 2.0 Credentials
```
1. Go to "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Add Authorized redirect URIs:
   - http://localhost:5000/auth/youtube/callback
   - https://yourdomain.com/auth/youtube/callback
5. Create and download credentials
6. Save in .env:
   - YOUTUBE_CLIENT_ID=xxx
   - YOUTUBE_CLIENT_SECRET=xxx
```

### Step 4: Get API Key (for read-only)
```
1. Create Credentials → API Key
2. Restrict key to YouTube Data API v3
3. Save as YOUTUBE_API_KEY in .env
```

---

## YouTube API Endpoints

### Upload a Video
```bash
POST https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart

Headers:
  - Authorization: Bearer ACCESS_TOKEN
  - Content-Type: application/json

Metadata:
{
  "snippet": {
    "title": "Your Video Title",
    "description": "Video description with #hashtags",
    "tags": ["tutorial", "youtube", "api"],
    "categoryId": "22",
    "defaultLanguage": "en"
  },
  "status": {
    "privacyStatus": "public",
    "publishAt": "2024-03-15T00:00:00Z"
  }
}

Video file requirements:
- Format: MP4, MOV, AVI, WMV, WEBM
- Size: Max 256 GB
- Duration: No limit
- Resolution: 4K supported
- Frame rate: Any

Example Node.js:
const { google } = require('googleapis');

const uploadToYouTube = async (videoPath, title, description, accessToken) => {
  const youtube = google.youtube({
    version: 'v3',
    auth: accessToken
  });

  const response = await youtube.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: {
        title,
        description,
        tags: ['video']
      },
      status: {
        privacyStatus: 'public'
      }
    },
    media: {
      body: fs.createReadStream(videoPath)
    }
  });

  return response.data.id;
};
```

### Get Video Stats
```bash
GET https://www.googleapis.com/youtube/v3/videos

Parameters:
  - id: VIDEO_ID
  - part: statistics,snippet,contentDetails
  - key: YOUR_API_KEY

Response:
{
  "items": [
    {
      "id": "dQw4w9WgXcQ",
      "snippet": {
        "title": "Video Title",
        "description": "Description",
        "publishedAt": "2024-01-15T10:30:00Z",
        "thumbnails": {...}
      },
      "statistics": {
        "viewCount": "123456",
        "likeCount": "5000",
        "commentCount": "234",
        "dislikeCount": "0"
      }
    }
  ]
}
```

### Get Channel Analytics (Requires OAuth)
```bash
GET https://www.googleapis.com/youtube/v3/channels

Parameters:
  - part: statistics,snippet
  - forUsername: USERNAME (or use 'mine' with OAuth)
  - key: API_KEY

Response includes:
- viewCount: Total channel views
- subscriberCount: Total subscribers
- videoCount: Videos uploaded
- hiddenSubscriberCount: Whether subscriber count is public
```

### Create a Playlist
```bash
POST https://www.googleapis.com/youtube/v3/playlists

Headers:
  - Authorization: Bearer ACCESS_TOKEN

Body:
{
  "snippet": {
    "title": "Social Media Handler Videos",
    "description": "Collection of amazing videos",
    "defaultLanguage": "en"
  },
  "status": {
    "privacyStatus": "public"
  }
}
```

### Add Video to Playlist
```bash
POST https://www.googleapis.com/youtube/v3/playlistItems

Body:
{
  "snippet": {
    "playlistId": "PLAYLIST_ID",
    "resourceId": {
      "kind": "youtube#video",
      "videoId": "VIDEO_ID"
    }
  }
}
```

## YouTube API Limits (Free Tier)

| Feature | Limit |
|---------|-------|
| API Quota | 10,000 units per day |
| Video Size | 256 GB max |
| Upload Speed | No limit |
| Video Duration | No limit |
| Concurrent Uploads | Multiple allowed |
| Storage | Unlimited |
| Analytics Lookback | Last 500 uploads |

**Quota Usage:**
- Insert video: 1600 units
- Get video: 1 unit
- Get channel stats: 1 unit

---

# 7. COMPARISON CHART

## Free Tier Comparison

| Platform | Free Posts/Day | Analytics | Video Support | Auth | Best For |
|----------|---|---|---|---|---|
| **Facebook** | 10 | Yes | Yes | OAuth 2.0 | Community building |
| **Instagram** | Unlimited | Basic | Yes (Reels) | OAuth 2.0 | Visual content |
| **Twitter** | Limited | Basic | Limited | OAuth 2.0 | Real-time updates |
| **LinkedIn** | 5 | Basic | Limited | OAuth 2.0 | B2B content |
| **TikTok** | 100 | Basic | Yes | OAuth 2.0 | Short videos |
| **YouTube** | Unlimited | Good | Yes | OAuth 2.0 | Long videos |

---

# 8. IMPLEMENTATION STEPS

## Step-by-Step Integration with Social Media Handler

### Phase 1: Backend Setup

#### Step 1: Install Required Packages
```bash
cd backend
npm install axios qs dotenv passport passport-facebook passport-instagram passport-twitter passport-oauth2
npm install google-auth-library googleapis --save

# For rate limiting and caching
npm install redis bull ioredis
```

#### Step 2: Create Social Media Service
```typescript
// backend/src/services/social-account.service.ts

import axios, { AxiosInstance } from 'axios';
import { PrismaClient } from '@prisma/client';

interface SocialAccountCredentials {
  platform: 'FACEBOOK' | 'INSTAGRAM' | 'TWITTER' | 'LINKEDIN' | 'TIKTOK' | 'YOUTUBE';
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  accountId: string;
  accountName: string;
}

class SocialMediaService {
  private prisma: PrismaClient;
  private facebookClient: AxiosInstance;
  private twitterClient: AxiosInstance;
  private instagramClient: AxiosInstance;
  private linkedinClient: AxiosInstance;
  private tiktokClient: AxiosInstance;
  private youtubeClient: AxiosInstance;

  constructor() {
    this.prisma = new PrismaClient();
    
    // Initialize clients
    this.facebookClient = axios.create({
      baseURL: 'https://graph.facebook.com/v18.0'
    });

    this.twitterClient = axios.create({
      baseURL: 'https://api.twitter.com/2',
      headers: {
        'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
      }
    });

    this.instagramClient = axios.create({
      baseURL: 'https://graph.instagram.com/v18.0'
    });

    this.linkedinClient = axios.create({
      baseURL: 'https://api.linkedin.com/v2'
    });

    this.tiktokClient = axios.create({
      baseURL: 'https://open.tiktokapis.com/v1'
    });

    this.youtubeClient = axios.create({
      baseURL: 'https://www.googleapis.com/youtube/v3'
    });
  }

  // Save social account credentials encrypted
  async connectAccount(
    userId: string,
    workspaceId: string,
    credentials: SocialAccountCredentials
  ) {
    const encryptedToken = this.encryptToken(credentials.accessToken);
    const encryptedRefresh = credentials.refreshToken 
      ? this.encryptToken(credentials.refreshToken) 
      : null;

    return await this.prisma.socialAccount.create({
      data: {
        workspaceId,
        userId,
        platform: credentials.platform,
        accountName: credentials.accountName,
        platformUserId: credentials.accountId,
        accessToken: encryptedToken,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: credentials.expiresAt,
        isConnected: true
      }
    });
  }

  // Post to Facebook
  async postToFacebook(
    pageId: string,
    content: string,
    mediaUrls?: string[],
    accessToken: string,
    scheduledTime?: Date
  ) {
    try {
      const payload: any = {
        message: content,
        access_token: accessToken
      };

      if (scheduledTime) {
        payload.scheduled_publish_time = Math.floor(scheduledTime.getTime() / 1000);
        payload.published = false;
      }

      if (mediaUrls && mediaUrls.length > 0) {
        // Post image
        payload.url = mediaUrls[0];
      }

      const response = await this.facebookClient.post(
        `/${pageId}/feed`,
        payload
      );

      return {
        success: true,
        postId: response.data.id,
        platform: 'FACEBOOK'
      };
    } catch (error) {
      console.error('Facebook post error:', error);
      throw error;
    }
  }

  // Post to Twitter
  async postToTwitter(
    content: string,
    mediaIds?: string[],
    accessToken: string,
    scheduledTime?: Date
  ) {
    try {
      const payload: any = { text: content };

      if (mediaIds && mediaIds.length > 0) {
        payload.media = { media_ids: mediaIds };
      }

      const response = await this.twitterClient.post('/tweets', payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return {
        success: true,
        postId: response.data.data.id,
        platform: 'TWITTER'
      };
    } catch (error) {
      console.error('Twitter post error:', error);
      throw error;
    }
  }

  // Post to Instagram
  async postToInstagram(
    userId: string,
    content: string,
    imageUrl: string,
    accessToken: string,
    scheduledTime?: Date
  ) {
    try {
      // Create media container
      const mediaResponse = await this.instagramClient.post(
        `/${userId}/media`,
        {
          image_url: imageUrl,
          caption: content,
          access_token: accessToken
        }
      );

      const mediaId = mediaResponse.data.id;

      // Publish media (if not scheduled)
      if (!scheduledTime) {
        await this.instagramClient.post(
          `/${mediaId}/publish`,
          { access_token: accessToken }
        );
      }

      return {
        success: true,
        postId: mediaId,
        platform: 'INSTAGRAM'
      };
    } catch (error) {
      console.error('Instagram post error:', error);
      throw error;
    }
  }

  // Post to LinkedIn
  async postToLinkedIn(
    personId: string,
    content: string,
    accessToken: string,
    scheduledTime?: Date
  ) {
    try {
      const payload = {
        author: `urn:li:person:${personId}`,
        lifecycleState: scheduledTime ? 'DRAFT' : 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.PublishText': {
            text: content
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      const response = await this.linkedinClient.post('/ugcPosts', payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return {
        success: true,
        postId: response.data.id,
        platform: 'LINKEDIN'
      };
    } catch (error) {
      console.error('LinkedIn post error:', error);
      throw error;
    }
  }

  // Post to TikTok
  async postToTikTok(
    openId: string,
    videoPath: string,
    caption: string,
    accessToken: string,
    scheduledTime?: Date
  ) {
    try {
      // Step 1: Upload video
      const fs = require('fs');
      const videoBuffer = fs.readFileSync(videoPath);

      const uploadResponse = await this.tiktokClient.post(
        '/post/publish/action/upload/',
        videoBuffer,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/octet-stream'
          },
          params: {
            upload_type: 'video_upload',
            video_size: videoBuffer.length
          }
        }
      );

      const uploadId = uploadResponse.data.data.upload_id;

      // Step 2: Create and publish post
      const publishResponse = await this.tiktokClient.post(
        '/post/publish/',
        {
          post_info: {
            title: caption.substring(0, 150),
            description: caption
          },
          source_info: {
            source: 'FILE_UPLOAD',
            video_upload_id: uploadId
          },
          post_mode: 'PUBLISH_TO_FEED',
          privacy_level: 'PUBLIC'
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return {
        success: true,
        postId: publishResponse.data.data.publish_id,
        platform: 'TIKTOK'
      };
    } catch (error) {
      console.error('TikTok post error:', error);
      throw error;
    }
  }

  // Post to YouTube
  async postToYouTube(
    videoPath: string,
    title: string,
    description: string,
    accessToken: string,
    scheduledTime?: Date
  ) {
    try {
      const { google } = require('googleapis');
      const fs = require('fs');

      const youtube = google.youtube({
        version: 'v3',
        auth: accessToken
      });

      const response = await youtube.videos.insert({
        part: 'snippet,status',
        requestBody: {
          snippet: {
            title,
            description,
            tags: ['socialmedia']
          },
          status: {
            privacyStatus: 'public',
            publishAt: scheduledTime ? scheduledTime.toISOString() : undefined
          }
        },
        media: {
          body: fs.createReadStream(videoPath)
        }
      });

      return {
        success: true,
        postId: response.data.id,
        platform: 'YOUTUBE'
      };
    } catch (error) {
      console.error('YouTube post error:', error);
      throw error;
    }
  }

  // Get analytics for a post
  async getPostAnalytics(
    platform: string,
    postId: string,
    accountId: string,
    accessToken: string
  ) {
    try {
      let metrics;

      switch (platform) {
        case 'FACEBOOK':
          metrics = await this.facebookClient.get(
            `/${postId}/insights`,
            {
              params: {
                metric: 'post_impressions,post_clicks,post_engaged_users',
                access_token: accessToken
              }
            }
          );
          break;

        case 'INSTAGRAM':
          metrics = await this.instagramClient.get(
            `/${postId}/insights`,
            {
              params: {
                metric: 'impressions,reach,engagement,saved',
                access_token: accessToken
              }
            }
          );
          break;

        case 'TWITTER':
          metrics = await this.twitterClient.get(`/tweets/${postId}`, {
            params: {
              'tweet.fields': 'public_metrics'
            },
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          break;

        case 'TIKTOK':
          metrics = await this.tiktokClient.get('/video/query/', {
            params: {
              fields: 'video_id,view_count,like_count,comment_count,share_count',
              access_token: accessToken
            }
          });
          break;

        case 'YOUTUBE':
          const { google } = require('googleapis');
          const youtube = google.youtube({
            version: 'v3',
            auth: accessToken
          });
          metrics = await youtube.videos.list({
            part: 'statistics',
            id: postId
          });
          break;
      }

      return metrics.data;
    } catch (error) {
      console.error('Analytics error:', error);
      throw error;
    }
  }

  private encryptToken(token: string): string {
    const crypto = require('crypto');
    const key = process.env.ENCRYPTION_KEY || '';
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decryptToken(encrypted: string): string {
    const crypto = require('crypto');
    const key = process.env.ENCRYPTION_KEY || '';
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

export default new SocialMediaService();
```

#### Step 3: Create OAuth Routes
```typescript
// backend/src/routes/auth.routes.ts

import express from 'express';
import passport from 'passport';
import { AuthController } from '../controllers';

const router = express.Router();

// Facebook OAuth
router.get('/facebook',
  passport.authenticate('facebook', { scope: ['pages_manage_posts', 'pages_read_analytics'] })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  AuthController.handleSocialCallback
);

// Instagram OAuth (via Facebook)
router.get('/instagram',
  passport.authenticate('facebook', { 
    scope: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights'] 
  })
);

// Twitter OAuth
router.get('/twitter',
  passport.authenticate('twitter', { scope: ['tweet.read', 'tweet.write', 'users.read'] })
);

router.get('/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  AuthController.handleSocialCallback
);

// LinkedIn OAuth
router.get('/linkedin',
  passport.authenticate('linkedin', { scope: ['r_liteprofile', 'w_member_social'] })
);

router.get('/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/login' }),
  AuthController.handleSocialCallback
);

// TikTok OAuth
router.get('/tiktok',
  passport.authenticate('tiktok', { scope: ['user.info.basic', 'video.upload'] })
);

router.get('/tiktok/callback',
  passport.authenticate('tiktok', { failureRedirect: '/login' }),
  AuthController.handleSocialCallback
);

// YouTube OAuth
router.get('/youtube',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/youtube'] })
);

router.get('/youtube/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  AuthController.handleSocialCallback
);

export default router;
```

### Phase 2: Frontend Integration

#### Step 1: Create Social Media Connection UI
```tsx
// frontend/src/pages/SocialAccounts.tsx

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import axios from 'axios';

export default function SocialAccounts() {
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  const platforms = [
    { name: 'Facebook', icon: '📘', color: '#1877F2' },
    { name: 'Instagram', icon: '📷', color: '#E4405F' },
    { name: 'Twitter', icon: '𝕏', color: '#000000' },
    { name: 'LinkedIn', icon: '💼', color: '#0077B5' },
    { name: 'TikTok', icon: '🎵', color: '#000000' },
    { name: 'YouTube', icon: '📺', color: '#FF0000' }
  ];

  useEffect(() => {
    fetchConnectedAccounts();
  }, []);

  const fetchConnectedAccounts = async () => {
    try {
      const response = await axios.get('/api/social-accounts');
      setConnectedAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const connectAccount = (platform) => {
    window.location.href = `/api/auth/${platform.toLowerCase()}/connect`;
  };

  const disconnectAccount = async (accountId) => {
    try {
      await axios.delete(`/api/social-accounts/${accountId}`);
      fetchConnectedAccounts();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Social Media Accounts</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map((platform) => {
          const connected = connectedAccounts.find(
            acc => acc.platform === platform.name.toUpperCase()
          );

          return (
            <Card key={platform.name} className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{platform.icon}</span>
                <h3 className="text-lg font-semibold">{platform.name}</h3>
              </div>

              {connected ? (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Connected as: <strong>{connected.accountName}</strong>
                  </p>
                  <Button
                    onClick={() => disconnectAccount(connected.id)}
                    variant="destructive"
                    className="w-full"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => connectAccount(platform.name)}
                  className="w-full"
                  style={{ backgroundColor: platform.color }}
                >
                  Connect Account
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

#### Step 2: Create Post to All Platforms
```tsx
// frontend/src/pages/CreatePost.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Textarea } from '@/components/ui/Textarea';
import axios from 'axios';

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    FACEBOOK: false,
    INSTAGRAM: false,
    TWITTER: false,
    LINKEDIN: false,
    TIKTOK: false,
    YOUTUBE: false
  });
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);

  const platforms = [
    { key: 'FACEBOOK', label: 'Facebook' },
    { key: 'INSTAGRAM', label: 'Instagram' },
    { key: 'TWITTER', label: 'Twitter' },
    { key: 'LINKEDIN', label: 'LinkedIn' },
    { key: 'TIKTOK', label: 'TikTok' },
    { key: 'YOUTUBE', label: 'YouTube' }
  ];

  const handlePublish = async () => {
    setLoading(true);
    try {
      const selectedPlatformsList = Object.keys(selectedPlatforms)
        .filter(key => selectedPlatforms[key]);

      await axios.post('/api/posts', {
        content,
        platforms: selectedPlatformsList,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
        status: scheduledTime ? 'SCHEDULED' : 'PUBLISHED'
      });

      alert('Post published/scheduled successfully!');
      setContent('');
      setSelectedPlatforms({
        FACEBOOK: false,
        INSTAGRAM: false,
        TWITTER: false,
        LINKEDIN: false,
        TIKTOK: false,
        YOUTUBE: false
      });
    } catch (error) {
      console.error('Error publishing post:', error);
      alert('Failed to publish post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create Post</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Content</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What do you want to share?"
          rows={6}
        />
        <p className="text-xs text-gray-500 mt-1">
          {content.length} characters
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-3">
          Select Platforms
        </label>
        <div className="grid grid-cols-2 gap-4">
          {platforms.map((platform) => (
            <div key={platform.key} className="flex items-center">
              <Checkbox
                id={platform.key}
                checked={selectedPlatforms[platform.key]}
                onChange={(checked) =>
                  setSelectedPlatforms({
                    ...selectedPlatforms,
                    [platform.key]: checked
                  })
                }
              />
              <label htmlFor={platform.key} className="ml-2 cursor-pointer">
                {platform.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Schedule (Optional)
        </label>
        <input
          type="datetime-local"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      <Button
        onClick={handlePublish}
        disabled={!content || Object.values(selectedPlatforms).every(v => !v) || loading}
        className="w-full"
        size="lg"
      >
        {loading ? 'Publishing...' : 'Publish to Selected Platforms'}
      </Button>
    </div>
  );
}
```

---

# 9. BEST PRACTICES

## API Keys & Credentials Management

### ✅ DO's
```
✓ Store all API keys in .env files
✓ Never commit .env to Git (.gitignore it)
✓ Rotate tokens regularly
✓ Use environment variables for different deployments
✓ Encrypt tokens before storing in database
✓ Use short-lived tokens (refresh tokens for long-lived)
✓ Monitor API usage and quotas
✓ Implement rate limiting on your backend
```

### ❌ DON'Ts
```
✗ Never hardcode API keys in code
✗ Never share API keys on GitHub
✗ Never log sensitive tokens
✗ Never use single token for all users
✗ Never skip input validation
✗ Never trust client-side validation only
✗ Never make API calls from frontend directly
```

## Rate Limiting & Quota Management

```typescript
// backend/src/middleware/rateLimit.ts

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from 'ioredis';

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

// API rate limiter
export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:api:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many API requests, please try again later.'
});

// Social media posting limiter
export const socialPostLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:social:'
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 posts per hour max
  keyGenerator: (req) => `${req.user.id}:${req.body.platform}`
});

// Analytics request limiter
export const analyticsLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:analytics:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 30 // 30 analytics requests per minute
});
```

## Error Handling

```typescript
// backend/src/middleware/error.ts

export const handleApiError = (error: any) => {
  if (error.response) {
    // API returned error status
    return {
      status: error.response.status,
      message: error.response.data?.error?.message || error.message,
      platform: error.config?.url || 'Unknown',
      retry: false
    };
  } else if (error.request) {
    // Request made but no response
    return {
      status: 503,
      message: 'Service Unavailable - Platform not responding',
      retry: true
    };
  } else {
    // Error in setup
    return {
      status: 500,
      message: error.message,
      retry: false
    };
  }
};
```

## Token Refresh Strategy

```typescript
// backend/src/utils/tokenRefresh.ts

export class TokenManager {
  async refreshAccessToken(
    platform: string,
    refreshToken: string,
    credentials: { clientId: string; clientSecret: string }
  ) {
    try {
      let newToken;

      switch (platform) {
        case 'FACEBOOK':
          newToken = await this.refreshFacebookToken(refreshToken, credentials);
          break;
        case 'TWITTER':
          newToken = await this.refreshTwitterToken(refreshToken, credentials);
          break;
        // ... other platforms
      }

      return newToken;
    } catch (error) {
      console.error(`Token refresh failed for ${platform}:`, error);
      // Trigger re-authentication
      throw new Error('Token refresh failed - please reconnect');
    }
  }

  private async refreshFacebookToken(token: string, creds: any) {
    const response = await axios.get('https://graph.facebook.com/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        fb_exchange_token: token
      }
    });
    return response.data.access_token;
  }
}
```

## Monitoring & Analytics

```typescript
// backend/src/services/analytics.service.ts

class AnalyticsTrackingService {
  async trackPostMetrics(
    postId: string,
    platform: string,
    metrics: any
  ) {
    // Store metrics in database with timestamp
    // Track engagement trends
    // Alert if performance is low
    // Generate reports
  }

  async generateReport(
    workspaceId: string,
    dateRange: { start: Date; end: Date }
  ) {
    // Aggregate metrics across all platforms
    // Calculate growth rates
    // Identify top-performing content
    // Generate PDF report
  }
}
```

---

# 10. FREE API QUOTAS SUMMARY

| Platform | Free Tier | Cost for Premium | Best Use |
|----------|-----------|------------------|----------|
| Facebook | 10 posts/hr | Free with limits | Community pages |
| Instagram | Unlimited | Free with limits | Visual content |
| Twitter | 300 API calls/15min | $100-500/month | Real-time content |
| LinkedIn | 5 posts/day | Free with limits | B2B content |
| TikTok | 100 posts/day | Free with limits | Short videos |
| YouTube | 10k quota/day | Free then paid | Long-form video |

---

## Conclusion

This comprehensive guide covers:
✅ How to get FREE API access for all major social platforms
✅ Authentication methods (OAuth 2.0)
✅ API endpoints for posting content
✅ Analytics and metrics retrieval
✅ Free tier limitations and upgrades
✅ Step-by-step implementation with code examples
✅ Best practices for security and rate limiting

**Next Steps:**
1. Create accounts on all desired platforms
2. Register as a developer
3. Create applications and get API credentials
4. Implement the Social Media Service in your backend
5. Add OAuth routes and controllers
6. Create frontend UI for account connection
7. Test posting across platforms
8. Implement analytics tracking
9. Monitor API usage and quotas
10. Scale based on your needs

**Additional Resources:**
- Facebook Developer Docs: https://developers.facebook.com/docs
- Twitter Developer Docs: https://developer.twitter.com/en/docs
- LinkedIn Developer Docs: https://docs.microsoft.com/en-us/linkedin/
- TikTok Developer Docs: https://developers.tiktok.com/
- YouTube API Docs: https://developers.google.com/youtube

Good luck with your Social Media Handler platform! 🚀
