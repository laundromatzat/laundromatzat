import React from "react";
import PageMetadata from "../../../components/PageMetadata";

const NeuroaestheticPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <PageMetadata
        title="Neuroaesthetic Lens"
        description="Reimagine environments using neuroaesthetic principles."
      />
      <div className="bg-zinc-900/50 rounded-2xl p-12 border border-zinc-800 text-center">
        <h1 className="text-4xl font-serif text-white mb-4">
          Neuroaesthetic Lens
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto mb-8">
          Analyze and transform spaces based on how the brain perceives beauty
          and environment.
        </p>
        <div className="p-8 bg-zinc-950/50 rounded-xl border border-zinc-800/50 inline-block">
          <p className="text-zinc-500">Analysis Component Loading...</p>
        </div>
      </div>
    </div>
  );
};

export default NeuroaestheticPage;
