import { PageContainer, ProCard, StatisticCard } from '@ant-design/pro-components';
import { Button, Col, Progress, Row } from 'antd';
import { CheckCircleOutlined, FileTextOutlined, PercentageOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useEffect, useState } from 'react';
import { listTodos } from "@/services/api/todos";
import { convertPageData } from "@/utils/request";

// 使用API定义的类型
interface TodoStatisticsChartProps {}

export default function TodoStatisticsChart({}: TodoStatisticsChartProps) {
  const [stats, setStats] = useState({
    completed: 0,
    total: 0,
    rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 数据获取逻辑
  const fetchData = async () => {
    try {
      setLoading(true);

      // 获取全量数据（分页处理）
    let allTodos: any[] = [];
    let current = 1;
    let total = 0;

    do {
      const response = await listTodos({
        pageNum:current,
        pageSize: 100, // 根据接口支持调整单次请求量
      });
      const pageData = convertPageData(response);
      
      allTodos = [...allTodos, ...(pageData.data || [])];
      total = pageData.total;
      current++;
    } while (allTodos.length < total && current < 100); // 安全限制防止死循环

    // 数据处理（过滤有效状态）
    const validTodos = allTodos.filter(item => 
      ['pending', 'completed'].includes(item.status)
    );

    // 统计计算
    const totalCount = validTodos.length;
    const completedCount = validTodos.filter(t => t.status === 'completed').length;

    setStats({
      completed: completedCount,
      total: totalCount,
      rate: totalCount > 0 ? Number(((completedCount / totalCount) * 100).toFixed(1)) : 0,
    });
  } catch (err) {
    setError(err as Error);
    console.error('数据加载失败:', err);
  } finally {
    setLoading(false);
  }
};

  // 请求控制
  useEffect(() => {
    fetchData();
  }, []);

  if (error) {
    return (
      <PageContainer>
        <ProCard style={{ marginTop: 24, padding: 24 }}>
          <div style={{
            height: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ff4d4f',
          }}>
            数据加载失败，请<a onClick={fetchData}>重试</a>
          </div>
        </ProCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ProCard
        title="任务统计面板"
        style={{ marginTop: 24 }}
        loading={loading}
        extra={[
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={fetchData}
          />,
        ]}
      >
        {/* 统计指标卡片 */}
        <ProCard style={{ marginBottom: 24, padding: 24 }}>
          <Row gutter={24}>
            <Col xs={24} sm={12} md={8}>
              <StatisticCard
                title="已完成任务"
                statistic={{
                  value: stats.completed,
                  icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                }}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <StatisticCard
                title="总任务数"
                statistic={{
                  value: stats.total,
                  icon: <FileTextOutlined style={{ color: '#1890ff' }} />,
                }}
              />
            </Col>
            <Col xs={24} sm={24} md={8}>
              <StatisticCard
                title="完成率"
                statistic={{
                  value: `${stats.rate}%`,
                  icon: <PercentageOutlined style={{ color: '#fa8c16' }} />,
                }}
                chart={
                  <Progress
                    type="circle"
                    percent={stats.rate}
                    width={50}
                    format={() => ''}
                  />
                }
                chartPlacement="right"
              />
            </Col>
          </Row>
        </ProCard>

        {/* 可视化图表区域 */}
        <ProCard title="任务状态分布">
          {stats.total === 0 ? (
            <div style={{
              height: 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
            }}>
              {loading ? '数据加载中...' : '暂无任务数据'}
            </div>
          ) : (
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'item',
                  formatter: '{a} <br/>{b}: {c} ({d}%)',
                },
                legend: {
                  orient: 'vertical',
                  left: 'left',
                },
                series: [
                  {
                    name: '任务状态分布',
                    type: 'pie',
                    radius: '50%',
                    data: [
                      { value: stats.completed, name: '已完成' },
                      { value: stats.total - stats.completed, name: '待处理' },
                    ],
                    emphasis: {
                      itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)',
                      },
                    },
                  },
                ],
              }}
              style={{ height: 400 }}
              opts={{ renderer: 'svg' }}
            />
          )}
        </ProCard>
      </ProCard>
    </PageContainer>
  );
}