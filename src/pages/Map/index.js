import React from 'react'

// 导入 axios
// import axios from 'axios'
import { API } from '../../utils/api'

// 导入 路由
import { Link } from 'react-router-dom'

// 导入 组件
import { Toast } from 'antd-mobile'

// 导入 BASE_URL
import { BASE_URL } from '../../utils/url'

// 导入 封装完成的 NavHeader 组件
import NavHeader from '../../components/NavHeader'

// 导入 封装完成的 NavHeader 组件
import HouseItem from '../../components/HouseItem'

// 导入 组件自身的 样式文件 // import './index.scss'
import styles from './index.module.css'

// 解决脚手架中全局变量访问问题
const BMapGL = window.BMapGL

// 覆盖物样式
const labelStyle = {
  cursor: 'pointer',
  border: '0px solid rgb(255, 0, 0)',
  padding: '0px',
  whiteSpace: 'nowrap',
  fontSize: '12px',
  color: 'rgb(255, 255, 255)',
  textAlign: 'center'
}

export default class Map extends React.Component {
  state = {
    // 小区下的房源列表
    housesList: [],
    // 表示是否展示房源列表
    isShowList: false
  }

  componentDidMount() {
    this.initMap()
  }

  // 初始化地图
  initMap() {
    // 获取当前定位城市
    const { label, value } = JSON.parse(localStorage.getItem('hkzf_city'))

    // 创建初始化地图实例
    const map = new BMapGL.Map('container')
    // 作用：能够在其他方法中通过 this 来获取到地图对象
    this.map = map
    // 设置中心点坐标
    // const point = new window.BMapGL.Point(116.404, 39.915)
    
    //创建地址解析器实例
    const myGeo = new BMapGL.Geocoder()
    // 将地址解析结果显示在地图上，并调整地图视野
    myGeo.getPoint(
      label,
      async (point) => {
        if(point) {
          // 初始化地图
          map.centerAndZoom(point, 11)
          
          // 添加常用控件
          const scaleCtrl = new BMapGL.ScaleControl() // 添加比例尺控件
          map.addControl(scaleCtrl)
          const zoomCtrl = new BMapGL.ZoomControl() // 添加缩放控件
          map.addControl(zoomCtrl)

          // 调用 renderOverlays 方法
          this.renderOverlays(value)
        }
      },
      label
    )

    // 给地图绑定移动事件
    map.addEventListener('movestart', () => {
      if(this.state.isShowList) {
        this.setState(() => {
          return {
            isShowList: false
          }
        })
      }
    })
  }

  // 渲染覆盖物入口
  // 1. 接收区域 id 参数，获取该区域下的房源数据
  // 2. 获取房源类型以及下级地图缩放级别
  async renderOverlays(id) {
    try {
      // 开启 loading
      Toast.loading('加载中...', 0, null, false)

      // 获取区域房源信息
      const res = await API.get(`/area/map?id=${id}`)

      // 关闭 loading
      Toast.hide()

      const data = res.data.body

      // 调用 getTypeAndZoom 方法获取级别和类型
      const { nextZoom, type } = this.getTypeAndZoom()

      data.forEach(item => {
        // 创建覆盖物
        this.createOverlays(item, nextZoom, type)
      })
    } catch (error) {
      // 关闭 loading
      Toast.hide()
    }
  }

  // 计算要绘制的覆盖物类型和下一个缩放级别
  // 区    -> 11, 范围：>=10 <12
  // 镇    -> 13, 范围：>=12 <14
  // 小区  -> 15, 范围：>=14 <16
  getTypeAndZoom() {
    // 调用地图的 getZoom() 方法，来获取当前缩放级别
    const zoom = this.map.getZoom()
    let nextZoom, type

    if(zoom >= 10 && zoom < 12) {
      // 区
      // 下一个缩放级别
      nextZoom = 13
      type = 'circle' // circle 表示绘制圆形覆盖物（区、镇）
    } else if(zoom >= 12 && zoom < 14) {
      // 镇
      nextZoom = 15
      type = 'circle' // circle 表示绘制圆形覆盖物（区、镇）
    } else if(zoom >= 14 && zoom < 16) {
      // 小区
      type = 'rect' // rect 表示绘制矩形覆盖物（小区）
    }
    return {
      nextZoom,
      type
    }
  }

  // 创建覆盖物
  createOverlays(data, zoom, type) {
    const {
      coord: { longitude, latitude },
      label: areaName,
      count,
      value
    } = data

    // 创建坐标对象
    const areaPoint = new BMapGL.Point(longitude, latitude)

    if(type === 'circle') {
      // 区或镇
      this.createCircle(areaPoint, areaName, count, value, zoom)
    } else {
      // 小区
      this.createRect(areaPoint, areaName, count, value)
    }
  }

  // 创建区、镇覆盖物
  createCircle(point, name, count, id, zoom) {
    // 创建覆盖物
    const label = new BMapGL.Label('', {
      position: point, // 指定文本标注所在的地理位置
      offset: new BMapGL.Size(-35, -35) // 设置文本偏移量
    })

    // 给 label 对象添加一个唯一标识
    label.id = id

    // 设置房源覆盖物内容
    label.setContent(`
      <div class="${styles.bubble}">
        <p class="${styles.name}">${name}</p>
        <p>${count}套</p>
      </div>
    `)

    // 自定义文本标注样式
    label.setStyle(labelStyle)

    // 添加单击事件
    label.addEventListener('click', () => {
      // 调用 renderOverlays 方法，获取该区域下房源数据
      this.renderOverlays(id)
      // 放大地图，以当前点击的覆盖物为中心放大地图
      this.map.centerAndZoom(point, zoom)
      // 清除当前覆盖物信息
      this.map.clearOverlays()
    })

    // 添加覆盖物到地图中
    this.map.addOverlay(label)
  }

  // 创建小区覆盖物
  createRect(point, name, count, id) {
    // 创建覆盖物
    const label = new BMapGL.Label('', {
      position: point, // 指定文本标注所在的地理位置
      offset: new BMapGL.Size(-50, -28) // 设置文本偏移量
    })

    // 给 label 对象添加一个唯一标识
    label.id = id

    // 设置房源覆盖物内容
    label.setContent(`
      <div class="${styles.rect}">
        <span class="${styles.housename}">${name}</span>
        <span class="${styles.housenum}">${count}套</span>
        <i class="${styles.arrow}"></i>
      </div>
    `)

    // 自定义文本标注样式
    label.setStyle(labelStyle)

    // 添加单击事件
    label.addEventListener('click', e => {
      // 获取并渲染房源数据
      this.getHouseList(id)
      // 获取当前被点击项坐标
      this.map.panBy(
        window.innerWidth / 2 - e.clientX, // 水平位移
        (window.innerHeight - 330) / 2 - e.clientY // 垂直位移
      )
    })

    // 添加覆盖物到地图中
    this.map.addOverlay(label)
  }

  

  // 获取小区房源数据
  async getHouseList(id) {
    try {
      // 开启 loading
      Toast.loading('加载中...', 0, null, false)

      const res = await API.get(`/houses?cityId=${id}`)

      // 关闭 loading
      Toast.hide()

      this.setState(() => {
        return {
          housesList: res.data.body.list,
          isShowList: true // 展示房源列表
        }
      })
    } catch (error) {
      // 关闭 loading
      Toast.hide()
    }
  }

  // 封装渲染房屋列表的方向
  renderHousesList() {
    return this.state.housesList.map(item => (
      <HouseItem
        onClick={() => {
          this.props.history.push(`/detail/${item.houseCode}`)
        }}
        key={item.houseCode}
        src={BASE_URL + item.houseImg}
        title={item.title}
        desc={item.desc}
        tags={item.tags}
        price={item.price}
      />
    ))
  }

  render() {
    return (
      <div className={styles.map}>
        {/* 顶部导航栏组件 */}
        <NavHeader>地图找房</NavHeader>
        {/* 地图容器元素 */}
        <div id="container" className={styles.container}></div>

        {/* 房源列表 */}
        {/* 添加 styles.show 展示房屋列表 */}
        <div className={[
          styles.houseList,
          this.state.isShowList ? styles.show : ''
          ].join(' ')}
        >
          <div className={styles.titleWrap}>
            <h1 className={styles.listTitle}>
              房屋列表
            </h1>
            <Link className={styles.titleMore} to="/home/list">
              更多房源
            </Link>
          </div>

          <div className={styles.houseItems}>
            {/* 房屋结构 */}
            {this.renderHousesList()}
          </div>
        </div>
      </div>
    )
  }
}
