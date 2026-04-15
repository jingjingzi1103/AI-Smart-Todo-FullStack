import { ModalForm, ProFormInstance } from '@ant-design/pro-components';
import { message } from 'antd';
import { useEffect, useState } from 'react';
import { Modal } from 'antd';

interface WeatherPopupProps {
  visible: boolean;
  onClose: (result?: number) => void;
}


 const WeatherPopup = (props: WeatherPopupProps) => {
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<{
    temperature?: number;
    windspeed?: number;
  } | null>(null);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        ' https://api.open-meteo.com/v1/forecast?latitude=36.389&longitude=120.447&current_weather=true'
      );
      const data = await response.json();
      setWeather(data.current_weather);
    } catch (error) {
      console.error('天气获取失败:', error);
      message.error('未能获取天气数据');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (props.visible) {
      fetchWeather();
    }
  }, [props.visible]);
 
  return (
    <Modal
      title="实时天气信息"
      open={props.visible} // 确保绑定到 visible 属性
      onCancel={() => props.onClose()}
      footer={null}
    >
      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <span>天气数据加载中...</span>
        </div>
      ) : weather ? (
        <div style={{ padding: '20px 0' }}>
          <p style={{ margin: '8px 0' }}>🌡️ 温度: {weather.temperature}°C</p>
          <p style={{ margin: '8px 0' }}>🌬️ 风速: {weather.windspeed} km/h</p>
        </div>
      ) : (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <span>⚠️ 未能获取天气数据</span>
        </div>
      )}
    </Modal>
  );
};
export default WeatherPopup;