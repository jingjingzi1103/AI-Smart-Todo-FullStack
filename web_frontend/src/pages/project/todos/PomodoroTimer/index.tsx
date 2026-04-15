import { ModalForm, ProForm, ProFormDigit, ProFormInstance } from '@ant-design/pro-components';
import { Button, Progress, Space, Statistic, notification } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, RedoOutlined } from '@ant-design/icons';
import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';

interface PomodoroProps {
  visible: boolean;
  onClose: (result?: boolean) => void;
}

// 默认时长（分钟）
const DEFAULT_WORK = 25;
const DEFAULT_BREAK = 5;

export default function PomodoroTimer({ visible, onClose }: PomodoroProps) {
  const formRef = useRef<ProFormInstance>();
  // 将时长改为状态管理
  const [workDuration, setWorkDuration] = useState(DEFAULT_WORK * 60);
  const [breakDuration, setBreakDuration] = useState(DEFAULT_BREAK * 60);
  const [secondsLeft, setSecondsLeft] = useState(workDuration);
  const [isWorking, setIsWorking] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [cycles, setCycles] = useState(0);

  // 添加配置表单状态
  const [settings] = useState({
    work: DEFAULT_WORK,
    break: DEFAULT_BREAK
  });

  // 修改后的计时器逻辑
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      handleCycleEnd();
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  // 更新周期结束处理
  const handleCycleEnd = () => {
    notification.success({
      message: isWorking ? '工作周期结束!' : '休息结束',
      description: isWorking 
        ? '该休息一下了，活动活动身体吧！' 
        : '准备开始新的工作周期吧！',
    });

    if (isWorking) {
      setCycles(c => c + 1);
    }

    setIsWorking(!isWorking);
    setSecondsLeft(isWorking ? breakDuration : workDuration);
    setIsRunning(false);
  };

  // 添加时长配置表单提交处理
  const handleSettingsChange = async(values: any) => {
    const newWork = values.work * 60;
    const newBreak = values.break * 60;
    
    setWorkDuration(newWork);
    setBreakDuration(newBreak);
    
    // 如果当前处于停止状态，立即更新计时器
    if (!isRunning) {
      setSecondsLeft(isWorking ? newWork : newBreak);
    }
  };

  const formatTime = (seconds: number) => {
    return moment.utc(seconds * 1000).format('mm:ss');
  };

  return (
    <ModalForm
      width={400}
      formRef={formRef}
      open={visible}
      onOpenChange={(visible) => {
        if (!visible) onClose();
      }}
      submitter={false}
      modalProps={{
        destroyOnClose: true,
        maskClosable: false,
        footer: null,
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="https://img.icons8.com/color/48/tomato.png" width={24} style={{ marginRight: 8 }} />
          <span>番茄工作钟</span>
        </div>
      }
      onFinish={handleSettingsChange}
      initialValues={settings}
    >
      {/* 添加时长配置表单 */}
      <ProForm.Group title="时长配置（分钟）">
        <ProFormDigit
          name="work"
          label="工作时长"
          min={1}
          max={120}
          fieldProps={{ 
            onChange: (value) => {
              if (value) {
                setWorkDuration(value * 60);
                if (!isRunning && isWorking) {
                  setSecondsLeft(value * 60);
                }
              }
            }
          }}
        />
        <ProFormDigit
          name="break"
          label="休息时长"
          min={1}
          max={60}
          fieldProps={{ 
            onChange: (value) => {
              if (value) {
                setBreakDuration(value * 60);
                if (!isRunning && !isWorking) {
                  setSecondsLeft(value * 60);
                }
              }
            }
          }}
        />
      </ProForm.Group>

      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Statistic 
            title={isWorking ? '工作周期' : '休息时间'}
            value={formatTime(secondsLeft)}
            valueStyle={{ fontSize: 32 }}
          />
          
          <Progress
            type="circle"
            percent={(secondsLeft / (isWorking ? workDuration : breakDuration)) * 100}
            format={() => formatTime(secondsLeft)}
            width={150}
            strokeColor={isWorking ? '#1890ff' : '#52c41a'}
          />

          <Space>
            <Button
              type="primary"
              icon={isRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? '暂停' : '开始'}
            </Button>
            
            <Button
              icon={<RedoOutlined />}
              onClick={() => {
                setIsRunning(false);
                setSecondsLeft(isWorking ? workDuration : breakDuration);
              }}
            >
              重置
            </Button>
          </Space>

          <Statistic
            title="已完成周期"
            value={cycles}
            suffix="次 / 今日"
            valueStyle={{ fontSize: 18 }}
          />
        </Space>
      </div>
    </ModalForm>
  );
}