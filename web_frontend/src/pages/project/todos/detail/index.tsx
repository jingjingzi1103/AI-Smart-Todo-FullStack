import { getTodos, updateTodos } from '@/services/api/todos';
import { PageContainer, ProForm, ProFormText, ProFormInstance, ProFormSelect } from '@ant-design/pro-components';
import { history, useSearchParams } from '@umijs/max';
import { message } from 'antd';
import { useEffect, useState, useRef } from 'react';

export default () => {
  const [searchParams] = useSearchParams();
  const form = useRef<ProFormInstance>(null);
  const id: any = searchParams.get('id') || '';
  const [eventData, setEventData] = useState<API.TodosDTO>();

  useEffect(() => {
    getTodos({ id }).then((result) => {
      setEventData(result || {});
      form?.current?.setFieldsValue(result);
    });
  }, []);
  const onFinish = async (values: any) => {
    const { title, description, status, dueDate } = values;
    const data: API.TodosDTO = {
      id,
      status,
      title,
      dueDate,
      description,
    };

    try {
      await updateTodos(data, { throwError: true });
      message.success('保存成功');
      history.push('/project/todos');
    } catch (ex) {
      return true;
    }
    return true;
  };
  return (
    <PageContainer>
      <ProForm formRef={form} onFinish={(values) => onFinish(values)}>
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
          <ProFormText
            name="dueDate"
            label="截止日期"
            rules={[
              {
                required: true,
                message: '请输入截止日期！',
              },
            ]}
          />
        </ProForm.Group>
        <ProFormText name="description" label="任务简要描述" />
      </ProForm>
    </PageContainer>
  );
};