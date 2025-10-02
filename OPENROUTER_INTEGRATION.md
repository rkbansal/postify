# 🚀 OpenRouter Integration

This document explains how to configure and use OpenRouter as an alternative to OpenAI for generating social media posts in Postify.

## 🔧 What is OpenRouter?

OpenRouter is a unified API that provides access to multiple AI models from different providers (OpenAI, Anthropic, Google, Meta, etc.) through a single interface. It offers:

- **Model Flexibility**: Access to 100+ AI models
- **Cost Optimization**: Choose models based on cost/performance needs
- **Reliability**: Automatic failover and load balancing
- **Transparency**: Clear pricing and usage analytics

## 📋 Setup Instructions

### 1. Get OpenRouter API Key

1. Visit [OpenRouter.ai](https://openrouter.ai)
2. Sign up for an account
3. Navigate to the API Keys section
4. Generate a new API key
5. Copy the key for configuration

### 2. Configure Environment Variables

Update your `.env` file in the server directory:

```env
# AI Service Configuration
AI_SERVICE=openrouter

# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_PREFER_FREE=true
OPENROUTER_APP_NAME=Postify
OPENROUTER_SITE_URL=http://localhost:3001
```

### 3. Available Models

Popular models you can use with OpenRouter:

#### OpenAI Models

- `openai/gpt-4o-mini` (Recommended - Fast & Cost-effective)
- `openai/gpt-4o`
- `openai/gpt-3.5-turbo`

#### Anthropic Models

- `anthropic/claude-3-haiku`
- `anthropic/claude-3-sonnet`
- `anthropic/claude-3-opus`

#### Google Models

- `google/gemini-pro`
- `google/gemini-pro-vision`

#### Meta Models

- `meta-llama/llama-3-8b-instruct`
- `meta-llama/llama-3-70b-instruct`

#### Other Popular Models

- `mistralai/mistral-7b-instruct`
- `cohere/command-r-plus`

#### Free Models (No Cost)

When `OPENROUTER_PREFER_FREE=true`, the system automatically selects from these free models:

- `google/gemma-7b-it:free` (Recommended free model)
- `meta-llama/llama-3-8b-instruct:free`
- `mistralai/mistral-7b-instruct:free`
- `microsoft/phi-3-mini-128k-instruct:free`
- `huggingfaceh4/zephyr-7b-beta:free`

**Note**: Free model availability may change. The system automatically detects available free models and selects the best one.

### 4. Configuration Options

| Variable                 | Description                                  | Default                 | Required                  |
| ------------------------ | -------------------------------------------- | ----------------------- | ------------------------- |
| `AI_SERVICE`             | Choose between 'openai' or 'openrouter'      | `openai`                | Yes                       |
| `OPENROUTER_API_KEY`     | Your OpenRouter API key                      | -                       | Yes (if using OpenRouter) |
| `OPENROUTER_MODEL`       | Model to use for generation                  | `openai/gpt-4o-mini`    | No                        |
| `OPENROUTER_PREFER_FREE` | Automatically use free models when available | `false`                 | No                        |
| `OPENROUTER_MAX_RETRIES` | Maximum models to try in fallback chain      | `3`                     | No                        |
| `OPENROUTER_RETRY_DELAY` | Base delay between retries (milliseconds)    | `1000`                  | No                        |
| `OPENROUTER_APP_NAME`    | App name for analytics                       | `Postify`               | No                        |
| `OPENROUTER_SITE_URL`    | Your site URL for referrer                   | `http://localhost:3001` | No                        |

## 🆓 Using Free Models

### Automatic Free Model Selection

Set `OPENROUTER_PREFER_FREE=true` to automatically use free models:

```env
OPENROUTER_PREFER_FREE=true
OPENROUTER_MAX_RETRIES=3
OPENROUTER_RETRY_DELAY=1000
```

**How it works:**

1. **Model Discovery**: Automatically fetches available free models from OpenRouter API
2. **Health Tracking**: Monitors model performance and availability in real-time
3. **Smart Fallback Chain**: Creates an ordered list of models to try based on health and preference
4. **Automatic Rotation**: If a model is overloaded/fails, automatically tries the next one
5. **Exponential Backoff**: Intelligent retry delays to avoid overwhelming rate limits
6. **Caching**: Caches model list and health data to reduce API calls
7. **Transparent Logging**: Shows detailed fallback chain progress in console logs

### Benefits of Free Models

- **Zero Cost**: No charges for API usage
- **High Reliability**: Automatic fallback chain ensures requests succeed
- **Good Quality**: Modern models like Gemma 7B and Llama 3 8B
- **Smart Rotation**: Automatically avoids overloaded models
- **Automatic Updates**: Always uses the latest available free models
- **Health Monitoring**: Tracks model performance and availability
- **Transparent**: Detailed logging of fallback chain progress

### Intelligent Fallback Chain

The system creates a dynamic fallback chain based on:

**Priority Order (when healthy):**

1. `google/gemma-7b-it:free` - Google's Gemma model (recommended)
2. `meta-llama/llama-3-8b-instruct:free` - Meta's Llama 3 model
3. `mistralai/mistral-7b-instruct:free` - Mistral's 7B model
4. `microsoft/phi-3-mini-128k-instruct:free` - Microsoft's Phi-3 model
5. `huggingfaceh4/zephyr-7b-beta:free` - Hugging Face's Zephyr model
6. `openchat/openchat-7b:free` - OpenChat model
7. `nousresearch/nous-hermes-llama2-13b:free` - Nous Research model

**Health-Based Ordering:**

- **Healthy models** (no recent failures) are prioritized
- **Recently failed models** are moved to end of chain
- **Overloaded models** are temporarily skipped (2-minute cooldown)
- **Configured fallback model** is always included as final option

**Automatic Rotation:**

- If Model A is overloaded → tries Model B
- If Model B fails → tries Model C
- Continues until success or all models exhausted
- Failed models are marked unhealthy for future requests

### Monitoring Fallback Chain

Check your console logs to see the fallback chain in action:

**Normal Operation:**

```
🆓 Found 5 free models on OpenRouter
🔄 Fallback chain: google/gemma-7b-it:free → meta-llama/llama-3-8b-instruct:free → mistralai/mistral-7b-instruct:free → ... (7 total)
🎯 Selected model: google/gemma-7b-it:free
🔄 Trying model 1/7: google/gemma-7b-it:free
✅ Success with model: google/gemma-7b-it:free
```

**Fallback in Action:**

```
🔄 Trying model 1/7: google/gemma-7b-it:free
❌ Model google/gemma-7b-it:free failed: OpenRouter API error: 429 - rate limit exceeded
⏳ Waiting 1000ms before trying next model...
🔄 Trying model 2/7: meta-llama/llama-3-8b-instruct:free
✅ Success with model: meta-llama/llama-3-8b-instruct:free
```

### Configuring Fallback Behavior

Fine-tune the fallback chain behavior with these environment variables:

```env
# Maximum number of models to try before giving up
OPENROUTER_MAX_RETRIES=3

# Base delay between retries (in milliseconds)
# Actual delay uses exponential backoff: delay * (attempt_number)
OPENROUTER_RETRY_DELAY=1000
```

**Retry Strategy:**

- **Attempt 1**: No delay
- **Attempt 2**: 1000ms delay (1 second)
- **Attempt 3**: 2000ms delay (2 seconds)
- **Attempt 4**: 3000ms delay (3 seconds)

**Health Monitoring:**

- Models with 3+ consecutive failures are marked unhealthy
- Recently failed models (within 2 minutes) are deprioritized
- Health data is cached for 5 minutes to avoid repeated failures
- Unhealthy models are automatically retried after cooldown period

## 🧪 Testing the Integration

### Method 1: Using the Test Script

```bash
cd server
node test-openrouter.js
```

### Method 2: API Testing

Start the server and test the generate endpoint:

```bash
# Start the server
pnpm dev:server

# Test with curl (requires authentication)
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "url": "https://example.com/article",
    "tone": "Professional",
    "platforms": ["Twitter", "LinkedIn"],
    "hashtags": ["tech", "ai"],
    "cta": "Learn more"
  }'
```

## 💰 Cost Comparison

OpenRouter provides transparent pricing. Here are some approximate costs per 1M tokens:

| Model                                    | Input Cost | Output Cost | Use Case                       |
| ---------------------------------------- | ---------- | ----------- | ------------------------------ |
| `google/gemma-7b-it:free` ⭐             | **FREE**   | **FREE**    | **Best free option**           |
| `meta-llama/llama-3-8b-instruct:free` ⭐ | **FREE**   | **FREE**    | **Excellent free alternative** |
| `mistralai/mistral-7b-instruct:free` ⭐  | **FREE**   | **FREE**    | **Quality free model**         |
| `openai/gpt-4o-mini`                     | $0.15      | $0.60       | Recommended paid option        |
| `anthropic/claude-3-haiku`               | $0.25      | $1.25       | Fast, good for simple tasks    |
| `meta-llama/llama-3-8b-instruct`         | $0.18      | $0.18       | Open source, cost-effective    |
| `openai/gpt-4o`                          | $5.00      | $15.00      | Highest quality, premium       |

⭐ **Recommended**: Set `OPENROUTER_PREFER_FREE=true` to automatically use these free models!

## 🔄 Switching Between Services

You can easily switch between OpenAI and OpenRouter by changing the `AI_SERVICE` environment variable:

```env
# Use OpenAI
AI_SERVICE=openai
OPENAI_API_KEY=your_openai_key

# Use OpenRouter
AI_SERVICE=openrouter
OPENROUTER_API_KEY=your_openrouter_key
```

No code changes required - the application automatically uses the configured service.

## 🐛 Troubleshooting

### Common Issues

1. **"OPENROUTER_API_KEY environment variable is required"**

   - Make sure you've set the API key in your `.env` file
   - Restart the server after adding the key

2. **"OpenRouter API error: 401"**

   - Check that your API key is valid
   - Ensure you have sufficient credits in your OpenRouter account

3. **"OpenRouter API error: 429"**

   - You've hit rate limits
   - Wait a moment and try again
   - Consider upgrading your OpenRouter plan

4. **"Model not found"**
   - Check that the model name is correct
   - Some models may require special access

### Debug Mode

Enable detailed logging by setting:

```env
NODE_ENV=development
```

This will show detailed request/response information in the console.

## 📊 Monitoring Usage

OpenRouter provides detailed analytics:

1. Visit your OpenRouter dashboard
2. View usage statistics by model
3. Monitor costs and performance
4. Set up usage alerts

## 🔒 Security Best Practices

1. **API Key Security**

   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly

2. **Rate Limiting**

   - The app includes built-in rate limiting
   - Monitor usage to prevent abuse

3. **Error Handling**
   - All API errors are properly handled
   - Sensitive information is not exposed to users

## 🚀 Performance Tips

1. **Model Selection**

   - Use `gpt-4o-mini` for most cases (fast + cheap)
   - Use `claude-3-haiku` for even faster responses
   - Use `gpt-4o` only when highest quality is needed

2. **Caching**

   - Consider implementing response caching for repeated requests
   - Cache article parsing results

3. **Monitoring**
   - Monitor response times and error rates
   - Set up alerts for service issues

## 📈 Future Enhancements

Potential improvements for the OpenRouter integration:

- [ ] Model selection UI in the frontend
- [ ] Usage analytics dashboard
- [ ] Automatic model fallback on errors
- [ ] Response caching
- [ ] Batch processing for multiple articles
- [ ] A/B testing different models

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review OpenRouter documentation: https://openrouter.ai/docs
3. Check server logs for detailed error messages
4. Ensure all environment variables are properly set

---

**Note**: This integration maintains full compatibility with the existing OpenAI setup. You can switch between services without any data loss or functionality changes.
