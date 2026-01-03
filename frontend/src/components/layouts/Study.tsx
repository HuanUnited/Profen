import useStudySession from '../../utils/hooks/useStudySession';
import StudyHeader from '../smart/StudyHeader';
import StudyContent from '../smart/StudyContent';
import StudyGrading from '../smart/StudyGrading';
import Loading from '../atomic/Loading';

export default function Study() {
  const { node, isLoading, progress, state, actions } = useStudySession();

  if (isLoading || !node) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#13141f]">
        <Loading message="Preparing Session..." />
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[#13141f] text-gray-200 overflow-hidden">
      {/* 1. Header with Progress */}
      <StudyHeader 
        progress={progress.current} 
        total={progress.total} 
        onExit={actions.exit}
      />

      {/* 2. Scrollable Content Area */}
      <StudyContent 
        node={node}
        isAnswerShown={state.isAnswerShown}
        onShowAnswer={actions.showAnswer}
      />

      {/* 3. Fixed Grading Bar */}
      <div className="shrink-0">
        <StudyGrading 
          onGrade={actions.grade}
          intervals={state.intervals}
          disabled={!state.isAnswerShown}
        />
      </div>
    </div>
  );
}