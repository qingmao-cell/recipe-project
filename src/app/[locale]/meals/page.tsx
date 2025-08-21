"use client";

import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Card,
  CardBody,
  Button,
  Text,
  Badge,
  SimpleGrid,
  Image,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  Divider,
  IconButton,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import {
  FaPlus,
  FaCalendarAlt,
  FaClock,
  FaTrash,
  FaEdit,
} from "react-icons/fa";
import Link from "next/link";

interface Recipe {
  id: string;
  title: string;
  imageUrl: string;
  prepTime: number;
  servings: number;
}

interface Meal {
  id: string;
  date: string;
  name: string;
  recipes: Recipe[];
  createdAt: string;
}

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [mealDate, setMealDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [mealName, setMealName] = useState("午餐");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const bgColor = useColorModeValue("#fefcf8", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");

  // 模拟数据
  useEffect(() => {
    const mockMeals: Meal[] = [
      {
        id: "1",
        date: "2025-01-08",
        name: "午餐",
        recipes: [
          {
            id: "1",
            title: "番茄鸡蛋面",
            imageUrl:
              "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=200&fit=crop",
            prepTime: 15,
            servings: 2,
          },
          {
            id: "2",
            title: "蒸蛋羹",
            imageUrl:
              "https://images.unsplash.com/photo-1564671165093-20688ff1fffa?w=300&h=200&fit=crop",
            prepTime: 10,
            servings: 2,
          },
        ],
        createdAt: "2025-01-08T12:30:00Z",
      },
      {
        id: "2",
        date: "2025-01-07",
        name: "晚餐",
        recipes: [
          {
            id: "3",
            title: "宫保鸡丁",
            imageUrl:
              "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&h=200&fit=crop",
            prepTime: 20,
            servings: 3,
          },
        ],
        createdAt: "2025-01-07T19:00:00Z",
      },
    ];
    setMeals(mockMeals);
  }, []);

  const createMeal = () => {
    if (selectedRecipes.length === 0) {
      toast({
        title: "请选择至少一道菜",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    const newMeal: Meal = {
      id: Date.now().toString(),
      date: mealDate,
      name: mealName,
      recipes: selectedRecipes,
      createdAt: new Date().toISOString(),
    };

    setMeals([newMeal, ...meals]);
    setSelectedRecipes([]);
    onClose();

    toast({
      title: "餐次记录已保存！",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  const deleteMeal = (mealId: string) => {
    setMeals(meals.filter((meal) => meal.id !== mealId));
    toast({
      title: "餐次记录已删除",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };

  const getMealIcon = (name: string) => {
    switch (name) {
      case "早餐":
        return "🌅";
      case "午餐":
        return "🌞";
      case "晚餐":
        return "🌙";
      default:
        return "🍽️";
    }
  };

  const getTotalTime = (recipes: Recipe[]) => {
    return recipes.reduce((total, recipe) => total + recipe.prepTime, 0);
  };

  const getTotalServings = (recipes: Recipe[]) => {
    return recipes.reduce((total, recipe) => total + recipe.servings, 0);
  };

  // 可选择的菜谱（模拟）
  const availableRecipes: Recipe[] = [
    {
      id: "1",
      title: "番茄鸡蛋面",
      imageUrl:
        "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=200&fit=crop",
      prepTime: 15,
      servings: 2,
    },
    {
      id: "2",
      title: "宫保鸡丁",
      imageUrl:
        "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&h=200&fit=crop",
      prepTime: 20,
      servings: 3,
    },
    {
      id: "3",
      title: "蒸蛋羹",
      imageUrl:
        "https://images.unsplash.com/photo-1564671165093-20688ff1fffa?w=300&h=200&fit=crop",
      prepTime: 10,
      servings: 2,
    },
  ];

  const toggleRecipeSelection = (recipe: Recipe) => {
    const isSelected = selectedRecipes.some((r) => r.id === recipe.id);
    if (isSelected) {
      setSelectedRecipes(selectedRecipes.filter((r) => r.id !== recipe.id));
    } else {
      setSelectedRecipes([...selectedRecipes, recipe]);
    }
  };

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* 头部 */}
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={2}>
              <Heading size="xl" color="brand.700" fontWeight="300">
                我的餐次记录
              </Heading>
              <Text color="brand.500" fontWeight="light">
                记录每餐吃什么，追踪饮食习惯
              </Text>
            </VStack>
            <Button
              leftIcon={<FaPlus />}
              colorScheme="sage"
              onClick={onOpen}
              borderRadius="full"
            >
              记录新餐次
            </Button>
          </HStack>

          {/* 统计卡片 */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Card bg={cardBg} borderRadius="2xl" shadow="sm">
              <CardBody textAlign="center">
                <VStack spacing={2}>
                  <Text fontSize="3xl">📊</Text>
                  <Heading size="lg" color="brand.700">
                    {meals.length}
                  </Heading>
                  <Text color="brand.500" fontSize="sm">
                    总餐次
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            <Card bg={cardBg} borderRadius="2xl" shadow="sm">
              <CardBody textAlign="center">
                <VStack spacing={2}>
                  <Text fontSize="3xl">🍽️</Text>
                  <Heading size="lg" color="brand.700">
                    {meals.reduce(
                      (total, meal) => total + meal.recipes.length,
                      0
                    )}
                  </Heading>
                  <Text color="brand.500" fontSize="sm">
                    制作菜品
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            <Card bg={cardBg} borderRadius="2xl" shadow="sm">
              <CardBody textAlign="center">
                <VStack spacing={2}>
                  <Text fontSize="3xl">⏱️</Text>
                  <Heading size="lg" color="brand.700">
                    {Math.round(
                      meals.reduce(
                        (total, meal) => total + getTotalTime(meal.recipes),
                        0
                      ) / meals.length || 0
                    )}
                  </Heading>
                  <Text color="brand.500" fontSize="sm">
                    平均用时(分钟)
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* 餐次列表 */}
          <Box>
            <VStack spacing={4} mb={6} align="center">
              <Heading size="lg" color="brand.700" fontWeight="300">
                餐次历史
              </Heading>
              <Box w="50px" h="1px" bg="sage.400" borderRadius="full" />
            </VStack>

            {meals.length === 0 ? (
              <Card bg={cardBg} borderRadius="2xl">
                <CardBody textAlign="center" py={16}>
                  <VStack spacing={4}>
                    <Text fontSize="6xl" opacity={0.3}>
                      🍽️
                    </Text>
                    <Text color="gray.500" fontSize="lg">
                      还没有餐次记录，开始记录你的第一餐吧！
                    </Text>
                    <Button
                      colorScheme="sage"
                      onClick={onOpen}
                      borderRadius="full"
                    >
                      记录第一餐
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ) : (
              <VStack spacing={6}>
                {meals.map((meal) => (
                  <Card
                    key={meal.id}
                    bg={cardBg}
                    borderRadius="2xl"
                    shadow="sm"
                    border="1px"
                    borderColor="gray.100"
                    w="full"
                  >
                    <CardBody p={6}>
                      <VStack spacing={4} align="stretch">
                        {/* 餐次头部信息 */}
                        <HStack justify="space-between" align="center">
                          <HStack spacing={4}>
                            <Text fontSize="2xl">{getMealIcon(meal.name)}</Text>
                            <VStack align="start" spacing={1}>
                              <HStack spacing={2}>
                                <Heading
                                  size="md"
                                  color="brand.700"
                                  fontWeight="400"
                                >
                                  {meal.name}
                                </Heading>
                                <Badge colorScheme="sage" borderRadius="full">
                                  {meal.recipes.length}道菜
                                </Badge>
                              </HStack>
                              <HStack
                                spacing={4}
                                color="brand.500"
                                fontSize="sm"
                              >
                                <HStack>
                                  <FaCalendarAlt />
                                  <Text>{meal.date}</Text>
                                </HStack>
                                <HStack>
                                  <FaClock />
                                  <Text>{getTotalTime(meal.recipes)}分钟</Text>
                                </HStack>
                              </HStack>
                            </VStack>
                          </HStack>
                          <IconButton
                            aria-label="删除餐次"
                            icon={<FaTrash />}
                            colorScheme="red"
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMeal(meal.id)}
                          />
                        </HStack>

                        <Divider />

                        {/* 菜谱列表 */}
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                          {meal.recipes.map((recipe) => (
                            <Card
                              key={recipe.id}
                              bg="gray.50"
                              borderRadius="xl"
                              size="sm"
                            >
                              <CardBody p={4}>
                                <HStack spacing={3}>
                                  <Image
                                    src={recipe.imageUrl}
                                    alt={recipe.title}
                                    w="60px"
                                    h="60px"
                                    objectFit="cover"
                                    borderRadius="lg"
                                  />
                                  <VStack align="start" spacing={1} flex={1}>
                                    <Text
                                      fontWeight="500"
                                      fontSize="sm"
                                      noOfLines={1}
                                    >
                                      {recipe.title}
                                    </Text>
                                    <HStack
                                      spacing={2}
                                      fontSize="xs"
                                      color="gray.600"
                                    >
                                      <Text>{recipe.prepTime}min</Text>
                                      <Text>{recipe.servings}人份</Text>
                                    </HStack>
                                  </VStack>
                                </HStack>
                              </CardBody>
                            </Card>
                          ))}
                        </SimpleGrid>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            )}
          </Box>
        </VStack>
      </Container>

      {/* 新建餐次弹窗 */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>记录新餐次</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6}>
              <HStack spacing={4} w="full">
                <FormControl>
                  <FormLabel>日期</FormLabel>
                  <Input
                    type="date"
                    value={mealDate}
                    onChange={(e) => setMealDate(e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>餐次</FormLabel>
                  <Select
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                  >
                    <option value="早餐">早餐</option>
                    <option value="午餐">午餐</option>
                    <option value="晚餐">晚餐</option>
                    <option value="夜宵">夜宵</option>
                    <option value="下午茶">下午茶</option>
                  </Select>
                </FormControl>
              </HStack>

              <Box w="full">
                <FormLabel>选择菜谱</FormLabel>
                <SimpleGrid columns={2} spacing={4}>
                  {availableRecipes.map((recipe) => (
                    <Card
                      key={recipe.id}
                      borderRadius="xl"
                      cursor="pointer"
                      border="2px"
                      borderColor={
                        selectedRecipes.some((r) => r.id === recipe.id)
                          ? "sage.400"
                          : "gray.200"
                      }
                      bg={
                        selectedRecipes.some((r) => r.id === recipe.id)
                          ? "sage.50"
                          : "white"
                      }
                      onClick={() => toggleRecipeSelection(recipe)}
                      _hover={{ borderColor: "sage.300" }}
                      transition="all 0.2s"
                    >
                      <CardBody p={4}>
                        <VStack spacing={3}>
                          <Image
                            src={recipe.imageUrl}
                            alt={recipe.title}
                            h="80px"
                            w="full"
                            objectFit="cover"
                            borderRadius="lg"
                          />
                          <VStack spacing={1}>
                            <Text
                              fontWeight="500"
                              fontSize="sm"
                              textAlign="center"
                              noOfLines={1}
                            >
                              {recipe.title}
                            </Text>
                            <HStack spacing={2} fontSize="xs" color="gray.600">
                              <Text>{recipe.prepTime}min</Text>
                              <Text>{recipe.servings}人</Text>
                            </HStack>
                          </VStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </Box>

              {selectedRecipes.length > 0 && (
                <Card bg="sage.50" borderRadius="xl" w="full">
                  <CardBody>
                    <VStack spacing={2}>
                      <Text fontWeight="500" color="sage.700">
                        已选择 {selectedRecipes.length} 道菜
                      </Text>
                      <HStack spacing={4} fontSize="sm" color="sage.600">
                        <Text>总用时: {getTotalTime(selectedRecipes)}分钟</Text>
                        <Text>
                          总份数: {getTotalServings(selectedRecipes)}人份
                        </Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              取消
            </Button>
            <Button colorScheme="sage" onClick={createMeal}>
              保存餐次
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
