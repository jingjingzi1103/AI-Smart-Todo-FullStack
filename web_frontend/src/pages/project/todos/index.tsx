import { deleteTodos, listTodos, aiCreate, breakdown } from "@/services/api/todos";
import { PageContainer, ProColumns, ActionType, ProTable, StatisticCard } from "@ant-design/pro-components";
import { Button, Input, FloatButton, Tag, Row, Col, message } from "antd";
import { useState, useRef, useEffect } from "react";
import { openConfirm } from '@/utils/ui';
import { orderBy } from "@/utils/request";
import { DeleteOutlined, PlusOutlined, SunOutlined, CalendarOutlined, ClockCircleOutlined, SendOutlined, RobotOutlined, ReloadOutlined } from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import InputDialog from './InputDialog';
import WeatherPopup from './WeatherPopup'; // 导入天气组件
import PomodoroTimer from './PomodoroTimer';
import moment from 'moment';

interface SortType {
  field?: string;
  order?: 'asc' | 'desc';
}



export default () => {
  const [weatherVisible, setWeatherVisible] = useState(false); // 控制天气弹窗
  const [searchProps, setSearchProps] = useState<API.DepartmentQueryDTO>({});
  const refAction = useRef<ActionType>(null);
  const [selectedRowKeys, selectRow] = useState<number[]>([]);
  const [visible, setVisible] = useState(false);
  const [eventData, setEventData] = useState<API.TodosVO>();
  const [showTodayOnly, setShowTodayOnly] = useState(false); // 新增状态变量
  const [pomodoroVisible, setPomodoroVisible] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiInput, setAiInput] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [urgencyStats, setUrgencyStats] = useState({
    overdue: 0,
    today: 0,
    week: 0,
    later: 0,
  });
  const [trendData, setTrendData] = useState<{ date: string; count: number }[]>([]);
  const [avgCycleDays, setAvgCycleDays] = useState<number>(0);
  const [completionRate, setCompletionRate] = useState<number>(0);
  const [overdueCount, setOverdueCount] = useState<number>(0);

  const handleBreakdown = (record: API.TodosVO) => {
    if (!record.id) {
      message.warning('该任务缺少 ID，无法拆解');
      return;
    }
    const id = record.id as number;
    openConfirm('确定要让 AI 帮您拆解这个任务吗？', async () => {
      const hide = message.loading('AI 正在帮您拆解任务，请稍候...', 0);
      try {
        await breakdown({ id }, { throwError: true });
        hide();
        message.success('✨ 任务已成功拆解为 3 条子项！');
        refAction.current?.reload();
        reloadDashboard();
      } catch (e) {
        hide();
        message.error('AI 拆解失败，请稍后再试~');
      }
    });
  };

  const handleAiSend = async () => {
    if (!aiInput?.trim()) {
      message.warning('先告诉我一点需求吧~');
      return;
    }
    setAiLoading(true);
    try {
      await aiCreate({ text: aiInput.trim() }, { throwError: true });
      setAiAssistantOpen(false);
      setAiInput('');
      message.success('✨ AI 已为您安排妥当！');
      refAction.current?.reload();
      reloadDashboard();
    } catch (e) {
      message.error('AI 小助手有点累，请稍后再试~');
    } finally {
      setAiLoading(false);
    }
  };

  // 仪表盘数据预处理
  const buildDashboard = (items: API.TodosVO[] = []) => {
    const now = moment();
    const todayStart = now.clone().startOf("day");
    const todayEnd = now.clone().endOf("day");
    const weekEnd = now.clone().endOf("week");

    let overdue = 0;
    let today = 0;
    let week = 0;
    let later = 0;

    let completed = 0;
    let pending = 0;
    let overdueTasks = 0;

    let totalCycleDays = 0;
    let cycleCount = 0;

    const last7Days: { [date: string]: number } = {};
    for (let i = 6; i >= 0; i--) {
      const d = now.clone().subtract(i, "days").format("YYYY-MM-DD");
      last7Days[d] = 0;
    }

    items.forEach((item) => {
      const status = item.status;
      if (status === "completed") {
        completed += 1;
      } else {
        pending += 1;
      }

      if (item.createdAt) {
        const createdDay = moment(item.createdAt).format("YYYY-MM-DD");
        if (last7Days[createdDay] !== undefined) {
          last7Days[createdDay] += 1;
        }
      }

      if (status === "pending" && item.dueDate) {
        const due = moment(item.dueDate);
        if (due.isBefore(now)) {
          overdue += 1;
          overdueTasks += 1;
        } else if (due.isBetween(todayStart, todayEnd, undefined, "[]")) {
          today += 1;
        } else if (due.isAfter(todayEnd) && due.isSameOrBefore(weekEnd)) {
          week += 1;
        } else if (due.isAfter(weekEnd)) {
          later += 1;
        }
      }

      if (status === "completed" && item.createdAt && item.updatedAt) {
        const created = moment(item.createdAt);
        const updated = moment(item.updatedAt);
        const diffDays = updated.diff(created, "hours") / 24;
        if (diffDays >= 0) {
          totalCycleDays += diffDays;
          cycleCount += 1;
        }
      }
    });

    setUrgencyStats({ overdue, today, week, later });
    setOverdueCount(overdueTasks);

    const total = completed + pending;
    setCompletionRate(total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0);
    setAvgCycleDays(cycleCount > 0 ? Number((totalCycleDays / cycleCount).toFixed(1)) : 0);

    const trendList = Object.keys(last7Days).map((d) => ({
      date: d,
      count: last7Days[d],
    }));
    setTrendData(trendList);
  };

  const reloadDashboard = async () => {
    setDashboardLoading(true);
    try {
      const resp: any = await listTodos({ current: 1, pageSize: 1000 } as API.TodosQueryDTO);
      const list: API.TodosVO[] = resp?.data?.list || resp?.list || [];
      buildDashboard(list);
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    reloadDashboard();
  }, []);

  const fetchData = async (params: API.TodosQueryDTO = {}, sort: SortType = {}) => {
    const props: API.TodosQueryDTO = { ...params, orderBy: orderBy(sort) };

    // 按钮打开“今日事项”时，直接把当前日期传给后端
    if (showTodayOnly) {
      props.dueDate = moment().format('YYYY-MM-DD');
    } else {
      // 关闭“今日事项”时，清空筛选条件
      delete props.dueDate;
    }

    setSearchProps(props);

    // 调用后台接口，拿到通用返回格式
    const response: any = await listTodos(props);

    // 兼容旧格式（直接返回 { list, total }）和新格式（{ data: { list, total } }）
    const list: API.TodosVO[] =
      response?.data?.list || response?.list || [];
    const total: number =
      response?.data?.total ?? response?.total ?? 0;

    const convertedData = {
      data: list,
      total,
      success: true,
    };

    // 增加时区信息调试
    console.log('[DEBUG] 系统时区偏移:', moment().format('Z'));

    // 统一返回 ProTable 所需格式（是否“今日事项”由后端根据 dueDate 处理）
    return convertedData;
  };
  const columns: ProColumns<API.TodosVO>[] = [
    {
      title: '事件ID',
      dataIndex: 'id',
      width: 70,
      search: false,
    },
    {
      title: '待办事件',
      dataIndex: 'title',
      width: 100,
      render: (dom, record) => {
        return (
          <a
            onClick={() => {
              setEventData(record);
              setVisible(true);
            }}
          >
            {dom}
          </a>
        );
      },
    },
    {
      title: '任务简要描述',
      dataIndex: 'description',
      search: false,
    },
    {
      title: '进展状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        pending: { text: '待处理', status: 'Default' }, // 状态标签颜色
        completed: { text: '已完成', status: 'Success' },
      },
      width: 100,
      search: false,
    },
    {
      title: '截止时间',
      dataIndex: 'dueDate',
      width: 180,
      search: false,
      valueType: 'dateTime',
      render: (_, record) => {
        if (!record.dueDate) {
          return '-';
        }
        const now = moment();
        const due = moment(record.dueDate);
        const isPending = record.status === 'pending';
        const isOverdue = isPending && due.isBefore(now);
        const hoursToDue = due.diff(now, 'hours', true);
        const isNearly = isPending && !isOverdue && hoursToDue <= 24 && hoursToDue >= 0;

        const color = isOverdue ? '#ff4d4f' : isNearly ? '#fa8c16' : undefined;

        return (
          <span style={{ color }}>
            {due.format('YYYY-MM-DD HH:mm:ss')}
            {isOverdue && (
              <Tag color="error" style={{ marginLeft: 8 }}>
                ⚠️ 已逾期
              </Tag>
            )}
          </span>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 150,
      search: false,
      valueType: 'dateTime',
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 150,
      search: false,
      valueType: 'dateTime',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      render: (_, record) => [
        <Button
          key="ai-breakdown"
          type="link"
          size="small"
          onClick={() => handleBreakdown(record)}
        >
          🤖 拆解
        </Button>,
      ],
    },
  ];

  const handleDelete = async () => {
    if (!selectedRowKeys?.length) return;
    openConfirm(`您确定删除这${selectedRowKeys.length}条待办事项吗`, async () => {
      await deleteTodos(selectedRowKeys);
      refAction.current?.reload();
    });
  };

  return (
    <PageContainer>
      {/* 顶部统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <StatisticCard
            loading={dashboardLoading}
            statistic={{
              title: '任务完成率',
              value: completionRate,
              suffix: '%',
              description: '已完成 / 全部任务',
            }}
            chart={<span style={{ fontSize: 20 }}>✅</span>}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatisticCard
            loading={dashboardLoading}
            statistic={{
              title: '平均处理耗时',
              value: avgCycleDays,
              suffix: ' 天',
              description: '从创建到完成',
            }}
            chart={<span style={{ fontSize: 20 }}>⚡</span>}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatisticCard
            loading={dashboardLoading}
            statistic={{
              title: '逾期任务数',
              value: overdueCount,
              description: '需要优先处理',
            }}
            chart={<span style={{ fontSize: 20 }}>🚩</span>}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatisticCard
            loading={dashboardLoading}
            statistic={{
              title: '总任务数',
              value: urgencyStats.overdue + urgencyStats.today + urgencyStats.week + urgencyStats.later,
              description: '当前系统中的任务',
            }}
            chart={<span style={{ fontSize: 20 }}>📅</span>}
          />
        </Col>
      </Row>

      {/* 第二行：任务紧急度分布 & 过去7天趋势 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <StatisticCard
            title="任务紧急度分布"
            loading={dashboardLoading}
            chart={
              <ReactECharts
                style={{ height: 260 }}
                option={{
                  tooltip: { trigger: 'axis' },
                  grid: { left: 40, right: 20, top: 30, bottom: 40 },
                  xAxis: {
                    type: 'category',
                    data: ['已逾期', '今日到期', '本周到期', '以后再说'],
                  },
                  yAxis: { type: 'value' },
                  series: [
                    {
                      type: 'bar',
                      data: [
                        { value: urgencyStats.overdue, itemStyle: { color: '#ff4d4f' } },
                        { value: urgencyStats.today, itemStyle: { color: '#fa8c16' } },
                        { value: urgencyStats.week, itemStyle: { color: '#52c41a' } },
                        { value: urgencyStats.later, itemStyle: { color: '#13c2c2' } },
                      ],
                      barWidth: 32,
                    },
                  ],
                }}
              />
            }
          />
        </Col>
        <Col xs={24} md={12}>
          <StatisticCard
            title="过去 7 天新增任务趋势"
            loading={dashboardLoading}
            chart={
              <ReactECharts
                style={{ height: 260 }}
                option={{
                  tooltip: { trigger: 'axis' },
                  grid: { left: 40, right: 20, top: 30, bottom: 40 },
                  xAxis: {
                    type: 'category',
                    data: trendData.map((d) => d.date.substr(5)),
                  },
                  yAxis: { type: 'value' },
                  series: [
                    {
                      type: 'line',
                      smooth: true,
                      areaStyle: { color: 'rgba(24,144,255,0.25)' },
                      lineStyle: { color: '#1890ff' },
                      data: trendData.map((d) => d.count),
                    },
                  ],
                }}
              />
            }
          />
        </Col>
      </Row>

      {/* 列表与工具栏 */}
      <ProTable<API.TodosVO>
        actionRef={refAction}
        rowKey="id"
        request={async (params = {}, sort) => {
          return fetchData(params, sort);
        }}
        toolBarRender={() => [
          <Button
            key="refresh-dashboard"
            type="default"
            icon={<ReloadOutlined spin={dashboardLoading} />}
            loading={dashboardLoading}
            onClick={reloadDashboard}
          >
            刷新数据
          </Button>,
          <Button
            key="today-filter"
            type={showTodayOnly ? 'primary' : 'default'}
            onClick={() => {
              setShowTodayOnly(!showTodayOnly); // 切换状态
              refAction.current?.reload(); // 重新加载数据
            }}
            icon={<CalendarOutlined />}
          >
            {showTodayOnly ? '显示全部' : '今日事项'} {/* 按钮文字根据状态动态变化 */}
          </Button>,
          <Button
            style={{
              backgroundColor: '#00b286', // 自定义背景颜色
              color: '#ffffff', // 文字颜色
            }}
            onClick={() => {
              setEventData(undefined);
              setVisible(true);
            }}
          >
            <PlusOutlined /> 新建
          </Button>,
          <Button
            type="primary"
            key="primary"
            danger
            onClick={handleDelete}
            disabled={!selectedRowKeys?.length}
          >
            <DeleteOutlined /> 删除
          </Button>,
          <Button
            style={{
              backgroundColor: '#00a9c5', // 自定义背景颜色
              color: '#ffffff', // 文字颜色
            }}
            icon={<SunOutlined />}
            onClick={() => {
              console.log('打开天气弹窗');
              setWeatherVisible(true);
            }}
          >
            天气
          </Button>,
          <Button
            key="pomodoro"
            style={{ backgroundColor: '#ff4d4f', color: '#ffffff' }}
            icon={<ClockCircleOutlined />}
            onClick={() => setPomodoroVisible(true)}
          >
            番茄钟
          </Button>,
        ]}
        columns={columns}
        rowSelection={{
          onChange: (rowKeys) => {
            selectRow(rowKeys as number[]);
          },
        }}
      />
      <InputDialog
        detailData={eventData}
        onClose={(result) => {
          setVisible(false);
          result && refAction.current?.reload();
        }}
        visible={visible}
      />
      <WeatherPopup
        visible={weatherVisible}
        onClose={() => {
          console.log('关闭天气弹窗');
          setWeatherVisible(false);
        }}
      />
      <PomodoroTimer
        visible={pomodoroVisible}
        onClose={() => setPomodoroVisible(false)}
      />
      {/* AI 悬浮助手：点击小球弹出稳定面板 */}
      {/* 弹出的对话面板，固定在小球左上侧 */}
      {aiAssistantOpen && (
        <div
          style={{
            position: "fixed",
            right: 80 + 320,
            bottom: 80 + 40,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: 300,
              padding: 12,
              background: "linear-gradient(135deg, #f0f5ff, #f9f0ff)",
              borderRadius: 16,
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                marginBottom: 8,
                fontSize: 13,
                color: "#595959",
              }}
            >
              主人，有什么我可以帮您的吗？(🐾)
            </div>
            <Input.TextArea
              rows={3}
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="例如：帮我生成一组本周的学习计划 Todo～"
              style={{
                resize: "none",
                marginBottom: 8,
                borderRadius: 12,
              }}
            />
            <div style={{ textAlign: "right" }}>
              <Button
                type="primary"
                size="small"
                icon={<SendOutlined />}
                loading={aiLoading}
                onClick={handleAiSend}
                style={{
                  borderRadius: 999,
                  background: "linear-gradient(135deg, #722ed1, #1890ff)",
                  border: "none",
                }}
              >
                发送
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* 悬浮小球本体 */}
      <div
        style={{
          position: "fixed",
          right: 80,
          bottom: 80,
          zIndex: 1000,
        }}
      >
        <FloatButton
          shape="circle"
          style={{
            width: 56,
            height: 56,
            background: "linear-gradient(135deg, #40a9ff, #9254de)",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            border: "none",
          }}
          icon={<RobotOutlined style={{ fontSize: 24 }} />}
          onClick={() => setAiAssistantOpen((open) => !open)}
        />
      </div>
    </PageContainer>
  );
};