import React, { useState } from 'react';
import './LearningModule.css';

const QUIZ_QUESTIONS = [
  { text: "Calculating total marks from 5 subject scores", answer: false, explanation: "This is a simple arithmetic rule (A+B+C+D+E). No pattern learning is needed." },
  { text: "Predicting house prices based on past sales data", answer: true, explanation: "There is no single formula for house prices. ML learns the pattern from historical data." },
  { text: "Sorting a list of numbers in ascending order", answer: false, explanation: "Standard algorithms (like QuickSort) do this perfectly. No ML required." },
  { text: "Recommending movies based on user viewing history", answer: true, explanation: "Complex user preferences can't be hardcoded. ML models find hidden patterns in similar users." },
];

const AI_ML_ITEMS = [
  { id: 1, name: "Rule-based Chatbot", type: "AI", desc: "Follows programmed 'if-then' paths." },
  { id: 2, name: "Spam Filter", type: "ML", desc: "Learns to identify spam from past emails." },
  { id: 3, name: "Chess Engine (Minimax)", type: "AI", desc: "Calculates all possible moves mechanically." },
  { id: 4, name: "Netflix Recommender", type: "ML", desc: "Learns from your watch history." },
  { id: 5, name: "Self-Driving Car Vision", type: "ML", desc: "Trained on millions of images to detect roads." },
];

export default function LearningModule() {
  // Quiz State
  const [qIdx, setQIdx] = useState(0);
  const [qFeedback, setQFeedback] = useState(null);

  // AI vs ML State
  const [classifications, setClassifications] = useState({});

  // Tabs State
  const [activeTab, setActiveTab] = useState('supervised');

  // Decision Tool State
  const [decisionStep, setDecisionStep] = useState(0);
  const [decisionFeedback, setDecisionFeedback] = useState(null);

  const handleQuiz = (choice) => {
    const isCorrect = choice === QUIZ_QUESTIONS[qIdx].answer;
    setQFeedback({ isCorrect, msg: QUIZ_QUESTIONS[qIdx].explanation });
  };

  const nextQuestion = () => {
    setQFeedback(null);
    setQIdx((prev) => (prev + 1) % QUIZ_QUESTIONS.length);
  };

  const handleClassify = (id, choice, actual) => {
    setClassifications(prev => ({ ...prev, [id]: choice === actual ? 'correct' : 'wrong' }));
  };

  const handleDecision = (choice) => {
    if (choice) {
      setDecisionFeedback({ isCorrect: true, msg: "Correct! The dataset links historical symptoms to unpredictable outcomes, requiring ML pattern recognition." });
    } else {
      setDecisionFeedback({ isCorrect: false, msg: "Incorrect. The disease outcome cannot be predicted using a simple Math formula; it needs an ML model to learn the symptoms' correlations." });
    }
  };

  return (
    <div className="learning-module p-6">
      <header className="mb-10 text-center">
        <h1>Machine Learning Concept Explorer</h1>
        <p className="subtitle mx-auto">Master the fundamentals of AI, Machine Learning, and Data Patterns.</p>
      </header>

      {/* Module 1: Quiz */}
      <section className="learning-section">
        <h2>1. Do We Really Need Machine Learning?</h2>
        <p className="mb-4 text-sm text-gray-400">Not every problem needs ML. Rule-based tasks use standard algorithms. Pattern-based tasks use ML.</p>
        
        <div className="bg-gray-900/50 p-6 rounded-xl border border-violet-900/30 relative">
          <p className="text-xs text-violet-400 font-mono mb-2">Scenario {qIdx + 1} of {QUIZ_QUESTIONS.length}</p>
          <p className="text-lg font-bold mb-6">{QUIZ_QUESTIONS[qIdx].text}</p>
          
          <div className="grid grid-cols-2 gap-4">
            <button className="btn-choice" onClick={() => handleQuiz(true)}>Use Machine Learning</button>
            <button className="btn-choice" onClick={() => handleQuiz(false)}>Do NOT Use Machine Learning</button>
          </div>

          {qFeedback && (
            <div className={`feedback-box ${qFeedback.isCorrect ? 'feedback-correct' : 'feedback-wrong'}`}>
              <strong>{qFeedback.isCorrect ? '✅ Correct!' : '❌ Incorrect!'}</strong>
              <p className="text-sm mt-1">{qFeedback.msg}</p>
              <button className="mt-3 px-4 py-1 bg-gray-800 rounded text-xs hover:bg-gray-700" onClick={nextQuestion}>
                Next Scenario ➔
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Module 2: AI vs ML */}
      <section className="learning-section">
        <h2>2. AI vs Machine Learning</h2>
        <p className="mb-4 text-sm text-gray-400"><strong>AI</strong> is any technique enabling computers to mimic human behavior. <strong>ML</strong> is a subset of AI where machines learn from data.</p>
        
        <div className="card-grid">
          {AI_ML_ITEMS.map(item => {
            const status = classifications[item.id];
            const clsName = status === 'correct' ? (item.type === 'AI' ? 'correct-ai' : 'correct-ml') : status === 'wrong' ? 'wrong' : '';
            return (
              <div key={item.id} className={`item-card ${clsName}`}>
                <p className="text-sm">{item.name}</p>
                <div className="action-btns">
                  <button className="btn-ai" onClick={() => handleClassify(item.id, 'AI', item.type)}>AI</button>
                  <button className="btn-ml" onClick={() => handleClassify(item.id, 'ML', item.type)}>ML</button>
                </div>
                {status === 'correct' && <p className="text-xs mt-2 opacity-80">{item.desc}</p>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Module 3: Supervised vs Unsupervised */}
      <section className="learning-section">
        <h2>3. Supervised vs Unsupervised Learning</h2>
        
        <div className="bg-gray-900/50 p-6 rounded-xl border border-violet-900/30">
          <div className="tabs">
            <button className={`tab ${activeTab === 'supervised' ? 'active' : ''}`} onClick={() => setActiveTab('supervised')}>Supervised Learning</button>
            <button className={`tab ${activeTab === 'unsupervised' ? 'active' : ''}`} onClick={() => setActiveTab('unsupervised')}>Unsupervised Learning</button>
          </div>
          
          <div className="p-4 bg-black/20 rounded-lg">
            {activeTab === 'supervised' ? (
              <div className="animate-fadeIn">
                <h3 className="text-violet-300">Supervised Learning</h3>
                <p className="text-sm mb-4">The model learns from a <strong>labeled dataset</strong>, meaning every input comes with the correct output answer (X → Y).</p>
                <div className="flex gap-4 mb-4">
                  <div className="bg-green-900/20 p-3 rounded border border-green-500/30 text-center flex-1">
                    <span className="text-2xl block mb-1">📧</span> Input: Email Text
                  </div>
                  <div className="flex items-center text-violet-500">➔</div>
                  <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30 text-center flex-1">
                    <span className="text-2xl block mb-1">🏷️</span> Label: "Spam" or "Not Spam"
                  </div>
                </div>
                <p className="text-xs text-gray-400"><em>Examples: Predicting house prices, classifying images, detecting fraudulent transactions.</em></p>
              </div>
            ) : (
              <div className="animate-fadeIn">
                <h3 className="text-pink-300">Unsupervised Learning</h3>
                <p className="text-sm mb-4">The model learns from an <strong>unlabeled dataset</strong>. It tries to find hidden structures or groups on its own.</p>
                <div className="flex gap-4 mb-4">
                  <div className="bg-yellow-900/20 p-3 rounded border border-yellow-500/30 text-center flex-1">
                    <span className="text-2xl block mb-1">👥</span> Input: Raw Customer Data
                  </div>
                  <div className="flex items-center text-pink-500">➔</div>
                  <div className="bg-pink-900/20 p-3 rounded border border-pink-500/30 text-center flex-1 flex gap-2 justify-center">
                    <div className="w-6 h-6 rounded-full bg-red-400/50 border border-red-400"></div>
                    <div className="w-6 h-6 rounded-full bg-blue-400/50 border border-blue-400"></div>
                    <div className="w-6 h-6 rounded-full bg-purple-400/50 border border-purple-400"></div>
                  </div>
                </div>
                <p className="text-xs text-gray-400"><em>Examples: Customer segmentation, anomaly detection, discovering topics in articles.</em></p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Module 4: Dataset Decision */}
      <section className="learning-section">
        <h2>4. Is ML Required for This Dataset?</h2>
        <p className="mb-4 text-sm text-gray-400">Inspect the dataset below and decide if Machine Learning adds value.</p>
        
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient Age</th>
              <th>Blood Pressure</th>
              <th>Cholesterol</th>
              <th>Disease Outcome (Target)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>45</td><td>120/80</td><td>190</td><td>Negative</td></tr>
            <tr><td>62</td><td>145/90</td><td>240</td><td>Positive</td></tr>
            <tr><td>38</td><td>115/75</td><td>185</td><td>Negative</td></tr>
          </tbody>
        </table>

        <div className="bg-gray-900/50 p-4 rounded-lg">
          {decisionStep === 0 && (
            <div className="animate-fadeIn">
              <p className="font-bold mb-3">Q1. Is there a hidden pattern to learn?</p>
              <button className="btn-choice" onClick={() => setDecisionStep(1)}>Yes, health stats correlate with outcomes.</button>
              <button className="btn-choice" onClick={() => alert("Think again! Humans can't easily calculate exact risks from raw numbers alone.")}>No, it's totally random.</button>
            </div>
          )}
          {decisionStep === 1 && (
            <div className="animate-fadeIn">
              <p className="font-bold mb-3">Q2. Is this problem purely rule-based?</p>
              <button className="btn-choice" onClick={() => alert("Incorrect. A single hardcoded rule like 'Age > 50' isn't accurate enough for medicine.")}>Yes, we just check if cholesterol > 200.</button>
              <button className="btn-choice" onClick={() => setDecisionStep(2)}>No, combinations of factors matter.</button>
            </div>
          )}
          {decisionStep === 2 && !decisionFeedback && (
            <div className="animate-fadeIn">
              <p className="font-bold mb-3">Final Decision:</p>
              <div className="grid grid-cols-2 gap-4">
                <button className="btn-choice border-green-500/50 hover:bg-green-500/20" onClick={() => handleDecision(true)}>Use Machine Learning</button>
                <button className="btn-choice border-red-500/50 hover:bg-red-500/20" onClick={() => handleDecision(false)}>Do NOT Use Machine Learning</button>
              </div>
            </div>
          )}

          {decisionFeedback && (
            <div className={`feedback-box ${decisionFeedback.isCorrect ? 'feedback-correct' : 'feedback-wrong'}`}>
              <strong>{decisionFeedback.isCorrect ? '✅ Excellent Decision!' : '❌ Incorrect Decision!'}</strong>
              <p className="text-sm mt-1">{decisionFeedback.msg}</p>
              <button className="mt-3 px-4 py-1 bg-gray-800 rounded text-xs hover:bg-gray-700" onClick={() => { setDecisionStep(0); setDecisionFeedback(null); }}>
                Restart Analysis ↺
              </button>
            </div>
           )}
        </div>
      </section>

    </div>
  );
}
