package redlib.backend.service;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import redlib.backend.model.Todos;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * AI 任务解析服务
 */
@Service
public class AiService {

    /**
     * 从配置文件中注入 AI Key
     */
    @Value("${ai.api-key}")
    private String apiKey;

    /**
     * 从配置文件中注入 AI 接口地址
     */
    @Value("${ai.api-url}")
    private String apiUrl;

    /**
     * JDK 17 HttpClient，复用一个实例
     */
    private final HttpClient httpClient = HttpClient.newHttpClient();

    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 使用 AI 将自然语言解析为 Todos 对象
     *
     * @param text 用户输入的自然语言
     * @return 映射后的 Todos 实体
     */
    public Todos parseTask(String text) {
        try {
            // 1. 获取当前系统时间，用于让 AI 正确解析相对时间
            String currentTime = LocalDateTime.now().format(DATE_TIME_FORMATTER);

            // 2. 组装 System Prompt 和 User Prompt
            String systemPrompt = "你是一个任务解析助手，请将用户输入解析为 JSON 格式，" +
                    "包含 title, description, dueDate(格式 yyyy-MM-dd HH:mm:ss)。只返回 JSON 内容。" +
                    "当前时间是：" + currentTime + "，请以此为基准解析诸如“明天”、“后天”、“下周”等相对时间。";

            String userPrompt = "用户输入：" + text;

            // 3. 构造 DeepSeek / OpenAI 风格的请求参数
            Map<String, Object> body = new HashMap<>();
            body.put("model", "deepseek-chat");
            body.put("temperature", 0.2);

            Map<String, Object> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", systemPrompt);

            Map<String, Object> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", userPrompt);

            body.put("messages", new Object[]{systemMessage, userMessage});

            String requestJson = JSONObject.toJSONString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson, StandardCharsets.UTF_8))
                    .build();

            // 3. 发送请求
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

            if (response.statusCode() / 100 != 2) {
                throw new RuntimeException("调用 AI 接口失败，HTTP 状态码：" + response.statusCode()
                        + "，响应体：" + response.body());
            }

            // 4. 解析 AI 返回，提取 JSON 字符串
            String raw = response.body();
            // 假设兼容 OpenAI/DeepSeek 的返回结构：choices[0].message.content
            JSONObject root = JSONObject.parseObject(raw);
            String content = root.getJSONArray("choices")
                    .getJSONObject(0)
                    .getJSONObject("message")
                    .getString("content");

            // content 应该是一个纯 JSON 字符串
            JSONObject json = JSONObject.parseObject(content);

            // 5. 映射到 Todos 实体
            Todos todos = new Todos();
            todos.setTitle(json.getString("title"));
            todos.setDescription(json.getString("description"));

            String dueDateStr = json.getString("dueDate");
            if (dueDateStr != null && !dueDateStr.isEmpty()) {
                LocalDateTime ldt = LocalDateTime.parse(dueDateStr, DATE_TIME_FORMATTER);
                todos.setDueDate(java.util.Date.from(ldt.atZone(ZoneId.systemDefault()).toInstant()));
            }

            // 创建时间和更新时间可以由业务层在持久化前补充
            return todos;
        } catch (Exception e) {
            throw new RuntimeException("解析任务失败", e);
        }
    }

    /**
     * 使用 AI 将一个大任务拆解为多个子任务
     *
     * @param title       父任务标题
     * @param description 父任务描述
     * @return 拆解得到的子任务列表（尚未设置状态/时间等字段）
     */
    public List<Todos> breakdownTask(String title, String description) {
        try {
            String systemPrompt = "你是一个任务管理专家。请将这个大任务拆解为 3 条具体的、可执行的子任务。" +
                    "严格以 JSON 数组格式返回，包含字段：title, description。不要有任何多余文字。";

            String userPrompt = "父任务标题：" + title + "；父任务描述：" + description;

            Map<String, Object> body = new HashMap<>();
            body.put("model", "deepseek-chat");
            body.put("temperature", 0.2);

            Map<String, Object> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", systemPrompt);

            Map<String, Object> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", userPrompt);

            body.put("messages", new Object[]{systemMessage, userMessage});

            String requestJson = JSONObject.toJSONString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

            if (response.statusCode() / 100 != 2) {
                throw new RuntimeException("调用 AI 接口失败，HTTP 状态码：" + response.statusCode()
                        + "，响应体：" + response.body());
            }

            String raw = response.body();
            JSONObject root = JSONObject.parseObject(raw);
            String content = root.getJSONArray("choices")
                    .getJSONObject(0)
                    .getJSONObject("message")
                    .getString("content");

            // content 是一个 JSON 数组字符串
            List<Todos> result = new ArrayList<>();
            for (Object item : JSON.parseArray(content)) {
                JSONObject obj = (JSONObject) item;
                Todos t = new Todos();
                t.setTitle(obj.getString("title"));
                t.setDescription(obj.getString("description"));
                result.add(t);
            }

            return result;
        } catch (Exception e) {
            throw new RuntimeException("任务拆解失败", e);
        }
    }
}

