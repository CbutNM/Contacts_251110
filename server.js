const express = require('express');
const cors = require('cors');
const contactsRouter = require('./routes/contacts');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码请求体

// 路由
app.use('/api/contacts', contactsRouter);

// 健康检查接口
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: '服务运行正常' });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({ success: false, message: '接口不存在' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: err.message
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`API接口地址: http://localhost:${PORT}/api/contacts`);
});

