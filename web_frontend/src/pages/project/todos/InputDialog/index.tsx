import { ModalForm, ProForm, ProFormInstance, ProFormSelect, ProFormText,ProFormDateTimePicker } from '@ant-design/pro-components';
import { message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { waitTime } from '@/utils/request';
import { addTodos, updateTodos } from '@/services/api/todos';


interface InputDialogProps {
  detailData?: API.TodosDTO;
  visible: boolean;
  onClose: (result: boolean) => void;
}

export default function InputDialog(props: InputDialogProps) {
  const form = useRef<ProFormInstance>(null);

  useEffect(() => {
    waitTime().then(() => {
      if (props.detailData) {
        form?.current?.setFieldsValue(props.detailData);
      } else {
        form?.current?.resetFields();
      }
    });
  }, [props.detailData, props.visible]);

  const onFinish = async (values: any) => {
    const { title, description, status, dueDate } = values;
    const data: API.TodosDTO = {
      id: props.detailData?.id,
      status,
      title,
      dueDate,
      description,
    };

    try {
      if (props.detailData) {
        await updateTodos(data, { throwError: true });
      } else {
        await addTodos(data, { throwError: true });
      }
    } catch (ex) {
      return true;
    }

    props.onClose(true);
    message.success('保存成功');
    return true;
  };
  

  return (
    <ModalForm
      width={600}
      onFinish={onFinish}
      formRef={form}
      modalProps={{
        destroyOnClose: true,
        onCancel: () => props.onClose(false),
      }}
      title={props.detailData ? '修改事件' : '新建事件'}
      open={props.visible}
    >
      <ProFormText
        name="title"
        label="事件名称"
        rules={[
          {
            required: true,
            message: '请输入事件名称！',
          },
        ]}
      />
      <ProForm.Group>
        <ProFormSelect
          name="status"
          label="进展状态"
          valueEnum={{            // 枚举值映射
            pending: '待处理',
            completed: '已完成',
          }}
        />
        <ProFormDateTimePicker
    name="dueDate"
    label="截止日期"
    // 关键配置：定义日期时间格式
    fieldProps={{
      format: 'YYYY-MM-DD HH:mm:ss', // 显示格式
      showTime: { format: 'HH:mm:ss' }, // 显示秒
    }}
    rules={[
      {
        required: true,
        message: '请选择截止日期！', // 修改提示语
      },
    ]}
    convertValue={(value) => { 
      // 处理提交时的值转换（若后端需要字符串）
      return typeof value === 'string' ? value : value?.format('YYYY-MM-DD HH:mm:ss');
    }}
  />
      </ProForm.Group>
      <ProFormText name="description" label="任务简要描述" />
    </ModalForm>
  );
};
