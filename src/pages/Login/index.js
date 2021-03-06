import React, { Component } from 'react'
import { Flex, WingBlank, WhiteSpace, Toast } from 'antd-mobile'

import { Link } from 'react-router-dom'

// 导入 withFormik
import { withFormik, Form, Field, ErrorMessage } from 'formik'

// 导入 Yup
import * as Yup from 'yup'

// 导入 API
import { API } from '../../utils'

import NavHeader from '../../components/NavHeader'

import styles from './index.module.css'

// 验证规则：
const REG_UNAME = /^[a-zA-Z_\d]{5,8}$/
const REG_PWD = /^[a-zA-Z_\d]{5,12}$/

class Login extends Component {
  // state = {
  //   username: '',
  //   password: ''
  // }

  // getUserName = e => {
  //   this.setState(() => {
  //     return {
  //       username: e.target.value
  //     }
  //   })
  // }

  // getPassword = e => {
  //   this.setState(() => {
  //     return {
  //       password: e.target.value
  //     }
  //   })
  // }

  // 表单提交事件的事件处理程序
  // handleSubmit = async e => {
  //   // 阻止表单提交时的默认行为
  //   e.preventDefault()
  // }

  render() {
    return (
      <div className={styles.root}>
        {/* 顶部导航 */}
        <NavHeader className={styles.navHeader}>账号登录</NavHeader>
        <WhiteSpace size="xl" />

        {/* 登录表单 */}
        <WingBlank>
          <Form>
            {/* 账号 */}
            <div className={styles.formItem}>
              <Field
                className={styles.input}
                name="username"
                placeholder="请输入账号"
              />
            </div>
            <ErrorMessage
              className={styles.error}
              name="username"
              component="div"
            />
            {/* 密码 */}
            {/* 长度为5到8位，只能出现数字、字母、下划线 */}
            {/* <div className={styles.error}>账号为必填项</div> */}
            <div className={styles.formItem}>
              <Field
                className={styles.input}
                name="password"
                type="password"
                placeholder="请输入密码"
              />
            </div>
            <ErrorMessage
              className={styles.error}
              name="password"
              component="div"
            />
            {/* 长度为5到12位，只能出现数字、字母、下划线 */}
            {/* <div className={styles.error}>账号为必填项</div> */}
            <div className={styles.formSubmit}>
              <button className={styles.submit} type="submit">
                登 录
              </button>
            </div>
          </Form>
          <Flex className={styles.backHome}>
            <Flex.Item>
              <Link to="/registe">还没有账号，去注册~</Link>
            </Flex.Item>
          </Flex>
        </WingBlank>
      </div>
    )
  }
}

// 使用 withFormik 高阶组件包装 Login 组件，为 Login 组件提供属性和方法
Login = withFormik({
  // 提供状态
  mapPropsToValues: () => ({
    username: '',
    password: ''
  }),

  // 添加表单校验规则
  validationSchema: Yup.object().shape({
    username: Yup.string()
      .required('账号为必填项')
      .matches(REG_UNAME, '长度为5到8位，只能出现数字、字母、下划线'),
    password: Yup.string()
      .required('密码为必填项')
      .matches(REG_PWD, '长度为5到12位，只能出现数字、字母、下划线')
  }),

  // 表单的提交事件
  handleSubmit: async (values, {props}) => {
    // 获取账号和密码
    const { username, password } = values

    // 发送请求
    const res = await API.post('/user/login', {
      username,
      password
    })

    const { status, body, description } = res.data

    if(status === 200) {
      // 登录成功
      localStorage.setItem('hkzf_token', body.token)
      // 无法通过 this 获取路由信息，通过第二个对象参数中获取 props 来使用
      if(!props.location.state) {
        // 此时，表示直接进入该页面，直接调用 go(-1) 即可
        props.history.go(-1)
      } else {
        // push: [home, login, map]
        // props.history.push(props.location.state.from.pathname)
        // replace: [home, map]
        props.history.replace(props.location.state.from.pathname)
      }
    } else {
      // 登录失败
      Toast.info(description, 2, null, false)
    }
  }
})(Login)

export default Login
