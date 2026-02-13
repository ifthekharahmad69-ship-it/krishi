import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Trophy, RotateCcw, ChevronRight, Loader2, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import QuizCard from '@/components/quiz/QuizCard';

export default function Quiz() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  const categories = [
    { id: 'crop_management', name: 'Crop Management', icon: '🌾', color: 'from-emerald-500 to-green-600' },
    { id: 'pest_control', name: 'Pest Control', icon: '🐛', color: 'from-red-500 to-rose-600' },
    { id: 'irrigation', name: 'Irrigation', icon: '💧', color: 'from-blue-500 to-cyan-600' },
    { id: 'soil_health', name: 'Soil Health', icon: '🌱', color: 'from-amber-500 to-orange-600' },
    { id: 'market_knowledge', name: 'Market Knowledge', icon: '📈', color: 'from-purple-500 to-violet-600' },
    { id: 'general', name: 'General Farming', icon: '🚜', color: 'from-gray-600 to-gray-700' },
  ];

  const startQuiz = async (category) => {
    setSelectedCategory(category);
    setIsLoading(true);
    setCurrentQuestion(0);
    setScore(0);
    setQuizComplete(false);

    const quizQuestions = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate 5 multiple choice quiz questions about ${category.name} for Indian farmers.
      
      Requirements:
      - Questions should be practical and relevant to Indian farming
      - Include a mix of easy, medium, and hard questions
      - Each question should have 4 options
      - Provide the correct answer index (0-3)
      - Make questions educational and informative`,
      response_json_schema: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                options: { type: 'array', items: { type: 'string' } },
                correctAnswer: { type: 'number' },
                explanation: { type: 'string' },
              },
            },
          },
        },
      },
    });

    setQuestions(quizQuestions.questions || []);
    setIsLoading(false);
  };

  const handleAnswer = (index) => {
    setSelectedAnswer(index);
  };

  const nextQuestion = () => {
    if (selectedAnswer === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }

    setShowResult(true);
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setQuizComplete(true);
        // Save score
        base44.entities.QuizScore.create({
          category: selectedCategory.id,
          score: selectedAnswer === questions[currentQuestion].correctAnswer ? score + 1 : score,
          total_questions: questions.length,
          difficulty: 'medium',
        });
      }
    }, 1500);
  };

  const resetQuiz = () => {
    setSelectedCategory(null);
    setQuestions([]);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizComplete(false);
  };

  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-950 dark:to-purple-950/30">
      {/* Header */}
      <div 
        className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="rounded-xl select-none dark:text-white dark:hover:bg-gray-800">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-white">Learn & Quiz</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Test your farming knowledge</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Category Selection */}
          {!selectedCategory && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Choose a Topic</h2>
                <p className="text-gray-500 dark:text-gray-400">Select a category to start the quiz</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {categories.map((category, index) => (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startQuiz(category)}
                    className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${category.color} p-6 text-white text-left shadow-lg select-none`}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <span className="text-3xl mb-3 block">{category.icon}</span>
                    <span className="font-semibold">{category.name}</span>
                    <ChevronRight className="absolute bottom-6 right-6 w-5 h-5 opacity-50" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Loading */}
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <Loader2 className="w-12 h-12 animate-spin text-purple-600 dark:text-purple-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Generating quiz questions...</p>
            </motion.div>
          )}

          {/* Quiz Questions */}
          {selectedCategory && !isLoading && !quizComplete && questions.length > 0 && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Progress */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  Score: {score}/{currentQuestion}
                </span>
              </div>
              <Progress value={progress} className="h-2" />

              {/* Question Card */}
              <QuizCard
                question={questions[currentQuestion].question}
                options={questions[currentQuestion].options}
                selectedAnswer={selectedAnswer}
                correctAnswer={questions[currentQuestion].correctAnswer}
                onSelect={handleAnswer}
                showResult={showResult}
              />

              {/* Explanation */}
              {showResult && questions[currentQuestion].explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/50 border-blue-100 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Explanation:</strong> {questions[currentQuestion].explanation}
                    </p>
                  </Card>
                </motion.div>
              )}

              {/* Next Button */}
              {selectedAnswer !== null && !showResult && (
                <Button
                  onClick={nextQuestion}
                  className="w-full rounded-xl h-12 bg-gradient-to-r from-purple-500 to-violet-600 select-none"
                >
                  {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </motion.div>
          )}

          {/* Quiz Complete */}
          {quizComplete && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Quiz Complete!</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Great job on completing the {selectedCategory.name} quiz</p>

              <Card className="p-6 rounded-2xl border-0 shadow-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white mb-6">
                <p className="text-lg opacity-80 mb-2">Your Score</p>
                <p className="text-5xl font-bold mb-2">{score}/{questions.length}</p>
                <div className="flex justify-center gap-1">
                  {[...Array(questions.length)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${i < score ? 'text-amber-400 fill-amber-400' : 'text-white/30'}`}
                    />
                  ))}
                </div>
              </Card>

              <div className="flex gap-3">
                <Button
                  onClick={resetQuiz}
                  variant="outline"
                  className="flex-1 rounded-xl h-12 dark:border-gray-700 dark:text-white select-none"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Another Topic
                </Button>
                <Button
                  onClick={() => startQuiz(selectedCategory)}
                  className="flex-1 rounded-xl h-12 bg-gradient-to-r from-purple-500 to-violet-600 select-none"
                >
                  Retry This Quiz
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}