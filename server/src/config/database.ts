import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/educational-resources';
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB连接成功');
    
    // 监听连接事件
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB连接错误:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB连接断开');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB重新连接成功');
    });
      } catch (error) {
    console.log('⚠️ MongoDB连接失败，应用将在内存模式下运行:', (error as Error).message);
    console.log('📝 注意：数据将不会持久化保存，重启应用后会丢失');
    // 不抛出错误，让应用继续运行
  }
};
