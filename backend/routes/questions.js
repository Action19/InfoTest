const express = require('express');
const Question = require('../models/Question');
const Test = require('../models/Test');
const { authenticateToken, isTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all questions for a test
router.get('/test/:testId', authenticateToken, async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId);
    
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    
    // Check permissions
    if (req.user.role === 'student' && !test.is_published) {
      return res.status(403).json({ error: 'Test is not published' });
    }
    
    if (req.user.role === 'teacher' && test.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Hide correct answers for students
    const includeAnswers = req.user.role !== 'student';
    const questions = await Question.getByTestId(testId, includeAnswers);
    
    // Return array directly for frontend compatibility
    res.json(questions);
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Failed to get questions' });
  }
});

// Get single question
router.get('/:id', authenticateToken, isTeacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    // Verify ownership
    const test = await Test.findById(question.test_id);
    if (req.user.role === 'teacher' && test.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({ question });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ error: 'Failed to get question' });
  }
});

// Create new question (teacher/admin only)
router.post('/', authenticateToken, isTeacherOrAdmin, async (req, res) => {
  try {
    const {
      test_id,
      question_text,
      question_type,
      options,
      correct_answer,
      points,
      explanation,
      image_url,
      order_number
    } = req.body;
    
    // Validation
    if (!test_id || !question_text || !question_type || !correct_answer) {
      return res.status(400).json({ 
        error: 'test_id, question_text, question_type, and correct_answer are required' 
      });
    }
    
    // Verify test exists
    const test = await Test.findById(test_id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    
    // Check ownership
    if (req.user.role === 'teacher' && test.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Validate question type
    const validTypes = [
      'single_choice', 'multiple_choice', 'true_false',
      'short_answer', 'code_writing', 'matching'
    ];
    
    if (!validTypes.includes(question_type)) {
      return res.status(400).json({ 
        error: 'Invalid question type',
        valid_types: validTypes
      });
    }
    
    // For choice questions, options are required
    if (['single_choice', 'multiple_choice'].includes(question_type) && !options) {
      return res.status(400).json({ error: 'Options are required for choice questions' });
    }
    
    const questionId = await Question.create({
      test_id,
      question_text,
      question_type,
      options,
      correct_answer,
      points: points || 1,
      explanation,
      image_url,
      order_number
    });
    
    // Update test question count
    await Test.updateQuestionCount(test_id);
    
    const question = await Question.findById(questionId);
    
    res.status(201).json({ 
      message: 'Question created successfully',
      question 
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// Bulk create questions
router.post('/bulk', authenticateToken, isTeacherOrAdmin, async (req, res) => {
  try {
    const { test_id, questions } = req.body;
    
    if (!test_id || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'test_id and questions array are required' });
    }
    
    // Verify test exists and check ownership
    const test = await Test.findById(test_id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    
    if (req.user.role === 'teacher' && test.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const createdQuestions = [];
    
    for (const q of questions) {
      const questionId = await Question.create({
        test_id,
        ...q
      });
      createdQuestions.push(questionId);
    }
    
    // Update test question count
    await Test.updateQuestionCount(test_id);
    
    res.status(201).json({ 
      message: `${createdQuestions.length} questions created successfully`,
      question_ids: createdQuestions
    });
  } catch (error) {
    console.error('Bulk create questions error:', error);
    res.status(500).json({ error: 'Failed to create questions' });
  }
});

// Update question
router.put('/:id', authenticateToken, isTeacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    // Check ownership
    const test = await Test.findById(question.test_id);
    if (req.user.role === 'teacher' && test.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updates = {};
    const allowedFields = [
      'question_text', 'question_type', 'options', 'correct_answer',
      'points', 'explanation', 'image_url', 'order_number'
    ];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    await Question.update(id, updates);
    const updatedQuestion = await Question.findById(id);
    
    res.json({ 
      message: 'Question updated successfully',
      question: updatedQuestion 
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Delete question
router.delete('/:id', authenticateToken, isTeacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    // Check ownership
    const test = await Test.findById(question.test_id);
    if (req.user.role === 'teacher' && test.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const testId = question.test_id;
    await Question.delete(id);
    
    // Update test question count
    await Test.updateQuestionCount(testId);
    
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Reorder questions
router.post('/reorder', authenticateToken, isTeacherOrAdmin, async (req, res) => {
  try {
    const { test_id, question_orders } = req.body;
    
    if (!test_id || !question_orders || !Array.isArray(question_orders)) {
      return res.status(400).json({ 
        error: 'test_id and question_orders array are required' 
      });
    }
    
    // Check ownership
    const test = await Test.findById(test_id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    
    if (req.user.role === 'teacher' && test.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await Question.reorder(test_id, question_orders);
    
    res.json({ message: 'Questions reordered successfully' });
  } catch (error) {
    console.error('Reorder questions error:', error);
    res.status(500).json({ error: 'Failed to reorder questions' });
  }
});

module.exports = router;



// Generate questions using AI (OpenAI GPT)
router.post('/generate-ai', authenticateToken, isTeacherOrAdmin, async (req, res) => {
  try {
    const { test_id, topic, count = 5, difficulty = 'medium', question_type = 'single_choice' } = req.body;

    console.log('AI Generate request:', { test_id, topic, count, difficulty, question_type });

    if (!test_id || !topic) {
      return res.status(400).json({ error: 'test_id and topic are required' });
    }

    // Verify test exists and user has permission
    const test = await Test.findById(test_id);
    if (!test) {
      console.log('Test not found:', test_id);
      return res.status(404).json({ error: 'Test not found' });
    }

    if (req.user.role === 'teacher' && test.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log('Creating questions...');
    
    // Generate demo questions
    const createdQuestions = [];
    for (let i = 0; i < count; i++) {
      try {
        const questionData = {
          test_id,
          question_text: `${topic} bo'yicha ${i + 1}-savol: Bu demo savol. OpenAI API integratsiya qilish kerak.`,
          question_type,
          options: JSON.stringify(['Variant A', 'Variant B', 'Variant C', 'Variant D']),
          correct_answer: 'Variant A',
          points: difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1,
          explanation: `Bu ${difficulty} qiyinlikdagi savol. AI bilan yaratilgan.`,
          order_number: (test.total_questions || 0) + i + 1
        };

        const questionId = await Question.create(questionData);
        createdQuestions.push({ id: questionId });
        console.log(`Question ${i + 1} created with ID:`, questionId);
      } catch (qError) {
        console.error(`Error creating question ${i + 1}:`, qError);
      }
    }

    console.log(`Created ${createdQuestions.length} questions`);

    res.json({
      message: `${createdQuestions.length} ta savol muvaffaqiyatli yaratildi`,
      count: createdQuestions.length,
      questions: createdQuestions
    });

  } catch (error) {
    console.error('❌ Generate AI questions error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to generate questions',
      details: error.message 
    });
  }
});
