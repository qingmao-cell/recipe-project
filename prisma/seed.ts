import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("开始创建种子数据...");

  // 清理现有数据
  await prisma.recipe.deleteMany();

  // 创建测试菜谱（使用新的结构化字段）
  const recipes = [
    {
      title: "番茄鸡蛋面",
      imageUrl:
        "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop&crop=center",
      sourceUrl: "https://example.com/tomato-egg-noodles",
      domain: "example.com",
      description: "经典家常面条，酸甜可口，汤汁浓郁",
      ingredients: ["番茄", "鸡蛋", "面条"],
      seasonings: ["盐", "糖", "生抽", "大葱"],
      tools: ["炒锅", "汤锅"],
      steps: {
        data: [
          "准备食材：面条、鸡蛋、番茄切块",
          "热锅下油，炒散鸡蛋盛起",
          "下番茄块炒出汁水",
          "加入开水煮开，放入面条",
          "面条煮熟后加入鸡蛋，调味即可",
        ]
      },
      tags: ["蛋白质", "维生素", "淀粉", "快手菜", "酸", "甜", "主食", "家常菜"],
      parseSource: "jsonld",
    },
    {
      title: "宫保鸡丁",
      imageUrl:
        "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop&crop=center",
      sourceUrl: "https://example.com/kung-pao-chicken",
      domain: "example.com",
      description: "川菜经典，麻辣鲜香，花生脆嫩",
      ingredients: ["鸡肉", "花生", "黄瓜", "胡萝卜"],
      seasonings: ["生抽", "老抽", "糖", "醋", "料酒", "花椒", "辣椒", "大葱", "生姜", "大蒜"],
      tools: ["炒锅"],
      steps: {
        data: [
          "鸡胸肉切丁，用料酒、生抽、淀粉腌制15分钟",
          "热锅炸花生米至金黄，盛起备用",
          "锅内留少许油，下鸡丁炒至变色",
          "下干辣椒、花椒爆香",
          "调入生抽、老抽、糖炒匀",
          "最后加入花生米和葱段炒匀即可",
        ]
      },
      tags: ["蛋白质", "辣", "甜", "咸", "川菜", "下饭菜", "经典菜"],
      parseSource: "jsonld",
    },
    {
      title: "蒸蛋羹",
      imageUrl:
        "https://images.unsplash.com/photo-1564671165093-20688ff1fffa?w=400&h=300&fit=crop&crop=center",
      sourceUrl: "https://example.com/steamed-egg",
      domain: "example.com",
      description: "嫩滑如豆腐的蒸蛋，口感丝滑",
      ingredients: ["鸡蛋", "牛奶"],
      seasonings: ["盐", "生抽", "香油", "大葱"],
      tools: ["蒸锅"],
      steps: {
        data: [
          "鸡蛋打散，加入少许盐",
          "缓慢倒入温水，搅拌均匀",
          "过筛去除泡沫",
          "盖上保鲜膜，用牙签扎几个小孔",
          "上锅蒸10-12分钟至凝固",
          "出锅后撒葱花，滴香油即可",
        ]
      },
      tags: ["蛋白质", "快手菜", "清淡", "嫩滑", "营养", "蒸菜"],
      parseSource: "readability",
    },
    {
      title: "麻婆豆腐",
      imageUrl:
        "https://images.unsplash.com/photo-1609501676725-7186f2c72bdf?w=400&h=300&fit=crop&crop=center",
      sourceUrl: "https://example.com/mapo-tofu",
      domain: "example.com",
      description: "川菜代表，麻辣鲜香，嫩滑下饭",
      ingredients: ["豆腐", "猪肉"],
      seasonings: ["豆瓣酱", "生抽", "花椒", "辣椒", "大葱", "生姜", "大蒜"],
      tools: ["炒锅"],
      steps: {
        data: [
          "豆腐切块，用盐水汆烫去豆腥味",
          "热锅下牛肉末炒散",
          "下豆瓣酱炒出红油",
          "加入豆腐块轻轻翻炒",
          "调入生抽，用淀粉水勾芡",
          "撒花椒粉和葱花即可",
        ]
      },
      tags: ["蛋白质", "辣", "麻", "咸", "川菜", "下饭菜"],
      parseSource: "microdata",
    },
    {
      title: "糖醋排骨",
      imageUrl:
        "https://images.unsplash.com/photo-1544784595-7ccb0b3e6c3c?w=400&h=300&fit=crop&crop=center",
      sourceUrl: "https://example.com/sweet-sour-ribs",
      domain: "example.com",
      description: "酸甜开胃，色泽红亮，老少皆宜",
      ingredients: ["猪肉"],
      seasonings: ["糖", "醋", "生抽", "老抽", "料酒", "生姜", "大葱", "盐"],
      tools: ["炒锅"],
      steps: {
        data: [
          "排骨洗净切段，焯水去血沫",
          "热锅下排骨煎至两面金黄",
          "加入葱姜爆香",
          "调入料酒、生抽、老抽",
          "加适量水焖煮20分钟",
          "最后加糖、醋调味，大火收汁即可",
        ]
      },
      tags: ["蛋白质", "酸", "甜", "咸", "江浙菜", "家常菜", "招牌菜", "ai_refined"],
      parseSource: "ai-refine",
    },
    {
      title: "青椒土豆丝",
      imageUrl: "/placeholders/cat.jpg",
      sourceUrl: "https://example.com/pepper-potato",
      domain: "example.com",
      description: "爽脆可口的家常快手菜",
      ingredients: ["青椒", "土豆"],
      seasonings: ["盐", "生抽", "醋"],
      tools: ["炒锅"],
      steps: {
        data: [
          "土豆去皮切丝，用清水浸泡去淀粉",
          "青椒洗净切丝",
          "热锅放油，下土豆丝翻炒",
          "加入青椒丝继续炒",
          "调入盐、生抽、醋，炒匀出锅"
        ]
      },
      tags: ["维生素", "淀粉", "快手菜", "酸", "咸", "家常菜", "素食"],
      parseSource: "jsonld",
    },
    {
      title: "红烧肉",
      imageUrl: "/placeholders/curry.jpg",
      sourceUrl: "https://example.com/braised-pork-belly",
      domain: "example.com",
      description: "肥而不腻，入口即化的传统名菜",
      ingredients: ["五花肉", "冰糖"],
      seasonings: ["生抽", "老抽", "料酒", "八角", "桂皮", "葱", "姜"],
      tools: ["炒锅", "砂锅"],
      steps: {
        data: [
          "五花肉切块，冷水下锅焯水",
          "锅中放少许油，加冰糖炒糖色",
          "下入肉块翻炒上色",
          "加入生抽、老抽、料酒",
          "加入八角、桂皮、葱姜和开水",
          "大火烧开后转小火炖1小时",
          "大火收汁即可"
        ]
      },
      tags: ["蛋白质", "脂肪", "传统菜", "甜", "咸", "硬菜", "宴客菜"],
      parseSource: "jsonld",
    },
    {
      title: "蒜蓉西兰花",
      imageUrl: "/placeholders/dog.jpg",
      sourceUrl: "https://example.com/garlic-broccoli",
      domain: "example.com",
      description: "清爽健康的素食",
      ingredients: ["西兰花"],
      seasonings: ["蒜", "盐", "生抽"],
      tools: ["炒锅"],
      steps: {
        data: [
          "西兰花切小朵，焯水",
          "蒜切末",
          "锅中放油，爆香蒜末",
          "下西兰花快速翻炒",
          "调味出锅"
        ]
      },
      tags: ["维生素", "快手菜", "素食", "清淡", "健康"],
      parseSource: "readability",
    },
    {
      title: "清蒸鲈鱼",
      imageUrl: "/placeholders/fan.jpg",
      sourceUrl: "https://example.com/steamed-bass",
      domain: "example.com",
      description: "鲜嫩清淡的粤菜经典",
      ingredients: ["鲈鱼"],
      seasonings: ["葱", "姜", "蒸鱼豉油", "料酒"],
      tools: ["蒸锅"],
      steps: {
        data: [
          "鲈鱼处理干净，两面划刀",
          "用料酒腌制10分钟",
          "鱼身铺葱姜丝",
          "大火蒸8分钟",
          "淋上蒸鱼豉油",
          "浇热油激香"
        ]
      },
      tags: ["蛋白质", "清淡", "粤菜", "健康", "鲜", "蒸菜"],
      parseSource: "microdata",
    },
    {
      title: "酸辣土豆丝",
      imageUrl: "/placeholders/cai.JPG",
      sourceUrl: "https://example.com/spicy-potato",
      domain: "example.com",
      description: "酸辣爽脆的经典素菜",
      ingredients: ["土豆"],
      seasonings: ["干辣椒", "花椒", "醋", "盐"],
      tools: ["炒锅"],
      steps: {
        data: [
          "土豆切丝，清水浸泡",
          "锅中放油，爆香干辣椒和花椒",
          "下土豆丝大火快炒",
          "加醋和盐调味",
          "炒至断生即可"
        ]
      },
      tags: ["淀粉", "酸", "辣", "快手菜", "素食", "川菜"],
      parseSource: "jsonld",
    },
    {
      title: "鱼香肉丝",
      imageUrl: "/placeholders/cat.jpg",
      sourceUrl: "https://example.com/yuxiang-pork",
      domain: "example.com",
      description: "无鱼却有鱼香的川菜名菜",
      ingredients: ["猪肉", "木耳", "笋丝", "胡萝卜"],
      seasonings: ["豆瓣酱", "醋", "糖", "生抽", "淀粉", "葱", "姜", "蒜"],
      tools: ["炒锅"],
      steps: {
        data: [
          "猪肉切丝腌制",
          "调制鱼香汁",
          "锅中放油，炒肉丝",
          "加入配菜炒匀",
          "倒入鱼香汁",
          "勾芡出锅"
        ]
      },
      tags: ["蛋白质", "维生素", "甜", "酸", "川菜", "下饭菜"],
      parseSource: "ai-refine",
    },
  ];

  for (const recipe of recipes) {
    await prisma.recipe.create({
      data: recipe,
    });
  }

  console.log("种子数据创建完成！");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
