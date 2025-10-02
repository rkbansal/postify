# 🔧 MongoDB Connection Troubleshooting

## ✅ Issue Resolved!

The MongoDB connection issue has been fixed by removing deprecated buffer options from the connection configuration.

## 🐛 Common MongoDB Connection Issues

### 1. **"option buffermaxentries is not supported"**

**Solution**: ✅ **FIXED** - Removed deprecated `bufferCommands` and `bufferMaxEntries` options

### 2. **MongoDB Not Running Locally**

```bash
# Check if MongoDB is running
mongosh --eval "db.runCommand('ping')"

# Start MongoDB (macOS with Homebrew)
brew services start mongodb/brew/mongodb-community

# Start MongoDB (Linux/Windows)
sudo systemctl start mongod  # Linux
net start MongoDB            # Windows
```

### 3. **Connection Timeout Issues**

- Check if MongoDB is listening on the correct port (default: 27017)
- Verify firewall settings
- For MongoDB Atlas, check IP whitelist

### 4. **Authentication Issues**

```env
# Local MongoDB (no auth by default)
MONGODB_URI=mongodb://localhost:27017/postify

# MongoDB with authentication
MONGODB_URI=mongodb://username:password@localhost:27017/postify

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/postify
```

### 5. **Network Issues**

```bash
# Test MongoDB connection
mongosh "mongodb://localhost:27017/postify" --eval "db.runCommand('ping')"

# Check if port is open
netstat -an | grep 27017  # Unix/Linux/macOS
netstat -an | findstr 27017  # Windows
```

## 🚀 Quick Setup Commands

### Install MongoDB (macOS)

```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community

# Verify installation
mongosh --eval "db.runCommand('ping')"
```

### Install MongoDB (Ubuntu/Debian)

```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

## 🔍 Testing Your Setup

### 1. Test Database Connection

```bash
cd server
node -e "
import('./src/config/database.js').then(async ({ connectDatabase }) => {
  const connected = await connectDatabase();
  console.log('✅ Database connected:', connected);
  process.exit(0);
}).catch(err => {
  console.error('❌ Connection failed:', err.message);
  process.exit(1);
});
"
```

### 2. Test Server Health

```bash
# Start the server
cd server
pnpm dev

# In another terminal, test health endpoint
curl http://localhost:3001/health
```

### 3. Expected Health Response

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "development",
  "database": {
    "status": "connected",
    "host": "localhost",
    "port": 27017,
    "name": "postify"
  },
  "authentication": {
    "googleOAuth": false,
    "sessionStore": true
  }
}
```

## 🛠️ Environment Variables

Make sure your `server/.env` file has the correct MongoDB URI:

```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/postify

# MongoDB Atlas (replace with your credentials)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/postify?retryWrites=true&w=majority
```

## 🔄 Restart Services

If you're still having issues:

```bash
# Stop all services
brew services stop mongodb/brew/mongodb-community  # macOS
sudo systemctl stop mongod  # Linux

# Clear any lock files (if needed)
sudo rm /tmp/mongodb-27017.sock  # Unix/Linux/macOS

# Restart MongoDB
brew services start mongodb/brew/mongodb-community  # macOS
sudo systemctl start mongod  # Linux

# Restart your Postify server
cd server
pnpm dev
```

## 📞 Still Having Issues?

1. Check MongoDB logs:

   ```bash
   # macOS (Homebrew)
   tail -f /usr/local/var/log/mongodb/mongo.log

   # Linux
   sudo tail -f /var/log/mongodb/mongod.log
   ```

2. Verify MongoDB version compatibility:

   ```bash
   mongosh --version
   ```

3. Check available disk space (MongoDB needs space for data)

4. For MongoDB Atlas:
   - Verify cluster is running
   - Check IP whitelist (add 0.0.0.0/0 for testing)
   - Verify username/password
   - Check connection string format

## ✅ Connection Fixed!

Your Postify application should now connect to MongoDB successfully. The server will:

- ✅ Connect to MongoDB on startup
- ✅ Save user profiles and preferences
- ✅ Store post history and interactions
- ✅ Provide authentication with session persistence

**Happy coding with MongoDB! 🎉**
