const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 获取所有联系人
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM contacts ORDER BY id DESC');
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('获取联系人列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取联系人列表失败',
            error: error.message
        });
    }
});

// 根据ID获取单个联系人（从数据库读取，不使用缓存）
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute('SELECT * FROM contacts WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '联系人不存在'
            });
        }
        
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('获取联系人失败:', error);
        res.status(500).json({
            success: false,
            message: '获取联系人失败',
            error: error.message
        });
    }
});

// 新增联系人
router.post('/', async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;
        
        // 验证必填字段
        if (!name || !phone) {
            return res.status(400).json({
                success: false,
                message: '姓名和手机号为必填项'
            });
        }
        
        // 验证手机号格式
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: '手机号格式不正确'
            });
        }
        
        // 检查手机号是否已存在
        const [existing] = await pool.execute('SELECT id FROM contacts WHERE phone = ?', [phone]);
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: '该手机号已存在'
            });
        }
        
        const [result] = await pool.execute(
            'INSERT INTO contacts (name, phone, email, address) VALUES (?, ?, ?, ?)',
            [name, phone, email || null, address || null]
        );
        
        // 从数据库读取刚插入的数据（不使用缓存）
        const [newContact] = await pool.execute('SELECT * FROM contacts WHERE id = ?', [result.insertId]);
        
        res.status(201).json({
            success: true,
            message: '联系人添加成功',
            data: newContact[0]
        });
    } catch (error) {
        console.error('添加联系人失败:', error);
        res.status(500).json({
            success: false,
            message: '添加联系人失败',
            error: error.message
        });
    }
});

// 修改联系人（从数据库读取，不使用缓存）
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, address } = req.body;
        
        // 先从数据库读取现有数据（不使用缓存）
        const [existing] = await pool.execute('SELECT * FROM contacts WHERE id = ?', [id]);
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '联系人不存在'
            });
        }
        
        // 验证必填字段
        if (!name || !phone) {
            return res.status(400).json({
                success: false,
                message: '姓名和手机号为必填项'
            });
        }
        
        // 验证手机号格式
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: '手机号格式不正确'
            });
        }
        
        // 检查手机号是否被其他联系人使用
        const [phoneCheck] = await pool.execute('SELECT id FROM contacts WHERE phone = ? AND id != ?', [phone, id]);
        if (phoneCheck.length > 0) {
            return res.status(400).json({
                success: false,
                message: '该手机号已被其他联系人使用'
            });
        }
        
        // 更新数据库
        await pool.execute(
            'UPDATE contacts SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?',
            [name, phone, email || null, address || null, id]
        );
        
        // 从数据库读取更新后的数据（不使用缓存）
        const [updated] = await pool.execute('SELECT * FROM contacts WHERE id = ?', [id]);
        
        res.json({
            success: true,
            message: '联系人更新成功',
            data: updated[0]
        });
    } catch (error) {
        console.error('更新联系人失败:', error);
        res.status(500).json({
            success: false,
            message: '更新联系人失败',
            error: error.message
        });
    }
});

// 删除联系人（基于数据库操作）
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // 先从数据库读取数据确认存在（不使用缓存）
        const [existing] = await pool.execute('SELECT * FROM contacts WHERE id = ?', [id]);
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '联系人不存在'
            });
        }
        
        // 从数据库删除
        await pool.execute('DELETE FROM contacts WHERE id = ?', [id]);
        
        res.json({
            success: true,
            message: '联系人删除成功'
        });
    } catch (error) {
        console.error('删除联系人失败:', error);
        res.status(500).json({
            success: false,
            message: '删除联系人失败',
            error: error.message
        });
    }
});

module.exports = router;

