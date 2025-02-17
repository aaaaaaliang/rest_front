package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func getUserRole(c *gin.Context) {
	// 从 Cookie 获取 Token
	token, err := c.Cookie("access_token")
	if err != nil {
		response.Success(c, response.Unauthorized, errors.New("未登录"))
		return
	}

	// 解析 Token，获取 `user_code`
	userCode, err := config.ParseJWT(token)
	if err != nil {
		response.Success(c, response.Unauthorized, errors.New("token 无效或已过期"))
		return
	}

	// 查询用户的角色
	var roles []string
	err = config.DB.Table(model.UserRole{}).Alias("ur").
		Join("INNER", []interface{}{model.Role{}, "r"}, "ur.role_code = r.code").
		Where("ur.user_code = ?", userCode).
		Select("r.code").
		Find(&roles)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "角色查询失败"})
		return
	}

	// 返回角色信息
	response.SuccessWithData(c, response.SuccessCode, gin.H{
		"user_code": userCode,
		"roles":     roles,
	})
} 