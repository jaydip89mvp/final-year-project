import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const questionsData = {
    dyslexia: [
        { id: 'D_Q1', text: "I find it difficult to read long sentences without losing my place." },
        { id: 'D_Q2', text: "I often skip words or lines while reading." },
        { id: 'D_Q3', text: "I read much slower than my classmates." },
        { id: 'D_Q4', text: "I need to re-read the same text many times to understand it." },
        { id: 'D_Q5', text: "Small or crowded text makes reading uncomfortable for me." },
        { id: 'D_Q6', text: "I feel tired quickly when I read for a long time." },
        { id: 'D_Q7', text: "I confuse similar looking letters such as b / d / p / q." },
        { id: 'D_Q8', text: "I confuse similar sounding words while reading." },
        { id: 'D_Q9', text: "I struggle to read new or unfamiliar words." },
        { id: 'D_Q10', text: "I guess words instead of reading them fully." },
        { id: 'D_Q11', text: "I find it difficult to pronounce long words." },
        { id: 'D_Q12', text: "I make spelling mistakes even in common words." },
        { id: 'D_Q13', text: "I find it difficult to remember correct spellings." },
        { id: 'D_Q14', text: "I write words in the wrong order or miss letters while writing." },
        { id: 'D_Q15', text: "I find it hard to copy text correctly from the board or screen." },
        { id: 'D_Q16', text: "I take more time than others to complete writing tasks." },
        { id: 'D_Q17', text: "I forget what I just read after finishing a paragraph." },
        { id: 'D_Q18', text: "I understand better when someone reads the text aloud to me." },
        { id: 'D_Q19', text: "I understand better when pictures or videos are used instead of only text." },
        { id: 'D_Q20', text: "I find it difficult to summarize what I read." },
        { id: 'D_Q21', text: "I prefer audio explanations instead of reading text." },
        { id: 'D_Q22', text: "I prefer videos or animations to understand concepts." },
        { id: 'D_Q23', text: "I learn better when information is shown step-by-step." },
        { id: 'D_Q24', text: "I need extra time to understand written instructions." },
        { id: 'D_Q25', text: "I feel anxious when I am asked to read aloud in class." },
        { id: 'D_Q26', text: "I avoid reading tasks when possible." },
        { id: 'D_Q27', text: "I feel frustrated when I cannot read as easily as others." },
        { id: 'D_Q28', text: "I feel more confident when learning material is presented in multiple formats." },
        { id: 'D_Q29', text: "I lose my place easily when reading without using my finger or a guide." },
        { id: 'D_Q30', text: "I feel more confident when text is spaced out or shown in larger font." }
    ],
    adhd: [
        { id: 'A_Q1', text: "I find it difficult to stay focused on a lesson for a long time." },
        { id: 'A_Q2', text: "I get distracted easily by sounds, movement, or people around me." },
        { id: 'A_Q3', text: "I start thinking about other things while studying." },
        { id: 'A_Q4', text: "I lose focus when the lesson is long or only text-based." },
        { id: 'A_Q5', text: "I find it difficult to complete a task without breaks." },
        { id: 'A_Q6', text: "I stop paying attention even when the topic is important." },
        { id: 'A_Q7', text: "I start assignments but find it hard to finish them." },
        { id: 'A_Q8', text: "I forget instructions after they are explained." },
        { id: 'A_Q9', text: "I find it difficult to plan my study time." },
        { id: 'A_Q10', text: "I miss important details in tasks or questions." },
        { id: 'A_Q11', text: "I lose track of what I am supposed to do during an activity." },
        { id: 'A_Q12', text: "I feel restless when I have to sit and study for a long time." },
        { id: 'A_Q13', text: "I feel the need to move, tap, or fidget while learning." },
        { id: 'A_Q14', text: "I find it difficult to remain seated during long lessons." },
        { id: 'A_Q15', text: "I feel uncomfortable during long silent reading or writing tasks." },
        { id: 'A_Q16', text: "I answer questions before fully reading or hearing them." },
        { id: 'A_Q17', text: "I click or select answers quickly without checking them properly." },
        { id: 'A_Q18', text: "I interrupt tasks and jump to another activity suddenly." },
        { id: 'A_Q19', text: "I find it difficult to wait for my turn during group activities or discussions." },
        { id: 'A_Q20', text: "I feel overwhelmed when too much information is given at once." },
        { id: 'A_Q21', text: "I understand better when lessons are broken into small steps." },
        { id: 'A_Q22', text: "I learn better when activities are short and interactive." },
        { id: 'A_Q23', text: "I find it easier to learn when there are quizzes or quick challenges." },
        { id: 'A_Q24', text: "I lose interest quickly when the lesson feels repetitive." },
        { id: 'A_Q25', text: "I feel bored when the lesson does not involve interaction." },
        { id: 'A_Q26', text: "I feel more motivated when I receive quick feedback." },
        { id: 'A_Q27', text: "I feel frustrated when I cannot maintain focus like others." },
        { id: 'A_Q28', text: "I feel more confident when learning activities feel like games." },
        { id: 'A_Q29', text: "I switch between tasks before completing the first one." },
        { id: 'A_Q30', text: "I perform better when tasks are broken into short timed activities." }
    ],
    asd: [
        { id: 'S_Q1', text: "I find it hard to understand what the teacher wants me to do." },
        { id: 'S_Q2', text: "I find it hard to ask questions when I do not understand." },
        { id: 'S_Q3', text: "I feel uncomfortable talking in front of others in class." },
        { id: 'S_Q4', text: "I find it hard to understand jokes or hidden meanings in lessons." },
        { id: 'S_Q5', text: "I prefer studying alone instead of in a group." },
        { id: 'S_Q6', text: "Bright lights, loud sounds or crowded classrooms make it difficult for me to focus." },
        { id: 'S_Q7', text: "Certain sounds (fans, chairs moving, talking) distract me strongly during lessons." },
        { id: 'S_Q8', text: "I feel uncomfortable with some visual layouts, colours or animations on learning screens." },
        { id: 'S_Q9', text: "I feel overwhelmed when many things are shown on the screen at the same time." },
        { id: 'S_Q10', text: "I find it easier to learn in a calm and predictable environment." },
        { id: 'S_Q11', text: "I feel uncomfortable when the lesson plan suddenly changes." },
        { id: 'S_Q12', text: "I prefer knowing exactly what will happen next in a lesson." },
        { id: 'S_Q13', text: "I feel anxious when instructions are not very clear." },
        { id: 'S_Q14', text: "I find it easier to learn when the lesson follows a fixed structure." },
        { id: 'S_Q15', text: "I feel stressed when activities are changed without warning." },
        { id: 'S_Q16', text: "I find it difficult to understand long verbal explanations." },
        { id: 'S_Q17', text: "I understand better when instructions are written clearly." },
        { id: 'S_Q18', text: "I understand better when visual examples are shown." },
        { id: 'S_Q19', text: "I need more time to process what is being explained." },
        { id: 'S_Q20', text: "I feel confused when several instructions are given at once." },
        { id: 'S_Q21', text: "I focus very strongly on topics that interest me." },
        { id: 'S_Q22', text: "I find it difficult to focus on topics that do not interest me." },
        { id: 'S_Q23', text: "I like repeating the same type of learning activity." },
        { id: 'S_Q24', text: "I feel comfortable when activities are similar each time." },
        { id: 'S_Q25', text: "I feel anxious during group activities or presentations." },
        { id: 'S_Q26', text: "I feel more comfortable when learning activities are predictable." },
        { id: 'S_Q27', text: "I feel more confident when learning materials are simple and clearly organised." },
        { id: 'S_Q28', text: "I feel more confident when learning materials use visuals, audio or examples instead of only text." },
        { id: 'S_Q29', text: "I feel uncomfortable when group discussions move too quickly." },
        { id: 'S_Q30', text: "I learn better when classroom routines remain the same each day." }
    ]
};

const Screening = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [step, setStep] = useState(0); // 0: Dyslexia, 1: ADHD, 2: ASD
    const [answers, setAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const categories = ['dyslexia', 'adhd', 'asd'];
    const currentCategory = categories[step];
    const currentQuestions = questionsData[currentCategory];

    // Auto-scroll to top on step change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: parseInt(value)
        }));
    };

    const isStepComplete = () => {
        return currentQuestions.every(q => answers[q.id] !== undefined);
    };

    const handleNext = () => {
        if (!isStepComplete()) {
            setError('Please answer all questions in this section before continuing.');
            return;
        }
        setError('');
        if (step < 2) {
            setStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
            setError('');
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const res = await API.post('/profile/screening', answers);
            if (res.data.success) {
                // Redirect to profile creation, where the predicted trait will be used
                navigate('/profile/create');
            }
        } catch (err) {
            console.error('Screening submission failed:', err);
            setError('Failed to submit screening. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const progress = ((Object.keys(answers).length) / 90) * 100;

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-white font-display mb-3">Learning Trait Screening</h1>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                    To personalize your learning experience, please answer these questions honestly.
                    This is a screening tool, not a clinical diagnosis.
                </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-10">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-indigo-400 capitalize">{currentCategory} Section</span>
                    <span className="text-sm font-medium text-slate-400">{Math.round(progress)}% Complete</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5">
                    <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            {/* Stepper Indicator */}
            <div className="flex justify-center mb-8 gap-4">
                {categories.map((cat, idx) => (
                    <div key={cat} className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step === idx ? 'bg-indigo-600 text-white' :
                            step > idx ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-500'
                            }`}>
                            {step > idx ? '✓' : idx + 1}
                        </div>
                        {idx < 2 && <div className={`w-8 h-0.5 ${step > idx ? 'bg-green-600' : 'bg-slate-800'}`}></div>}
                    </div>
                ))}
            </div>

            {/* Questions List */}
            <div className="glass-panel p-8 sm:rounded-2xl border border-white/5 space-y-8 animate-fade-in">
                <h2 className="text-2xl font-bold text-white border-b border-slate-700 pb-4 mb-6 uppercase tracking-wider">
                    {currentCategory === 'dyslexia' && 'Reading & Writing Related'}
                    {currentCategory === 'adhd' && 'Attention & Focus Related'}
                    {currentCategory === 'asd' && 'Communication & Sensory Related'}
                </h2>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-6">
                        {error}
                    </div>
                )}

                <div className="space-y-10">
                    {currentQuestions.map((q, idx) => (
                        <div key={q.id} className="space-y-4">
                            <div className="flex gap-4">
                                <span className="text-indigo-500 font-bold">{idx + 1}.</span>
                                <p className="text-white text-lg">{q.text}</p>
                            </div>
                            <div className="grid grid-cols-5 gap-2 lg:gap-4">
                                {[1, 2, 3, 4, 5].map((val) => (
                                    <button
                                        key={val}
                                        onClick={() => handleAnswerChange(q.id, val)}
                                        className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 ${answers[q.id] === val
                                            ? 'border-indigo-500 bg-indigo-600/10 text-white'
                                            : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700'
                                            }`}
                                    >
                                        <span className="text-lg font-bold">{val}</span>
                                        <span className="text-[10px] uppercase mt-1 text-center hidden sm:block">
                                            {val === 1 && 'Never'}
                                            {val === 2 && 'Rarely'}
                                            {val === 3 && 'Sometimes'}
                                            {val === 4 && 'Often'}
                                            {val === 5 && 'Always'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Controls */}
                <div className="flex justify-between items-center pt-10 border-t border-slate-800 mt-10">
                    <button
                        onClick={handleBack}
                        disabled={step === 0 || isLoading}
                        className={`px-6 py-3 rounded-xl font-bold text-slate-300 transition-all ${step === 0 || isLoading ? 'opacity-0 pointer-events-none' : 'hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        Back
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={isLoading}
                        className={`px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-70 flex items-center`}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            step < 2 ? 'Save & Continue' : 'Finish & See Results'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Screening;
