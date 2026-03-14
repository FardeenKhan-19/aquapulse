'use client';

import { useParams } from 'next/navigation';
import { useForensicsReport } from '@/lib/hooks/useForensics';
import { PageHeader } from '@/components/layout/PageHeader';
import { ForensicsCard } from '@/components/forensics/ForensicsCard';
import { SourceConfidenceBar } from '@/components/forensics/SourceConfidenceBar';
import { ContaminationTimeline } from '@/components/forensics/ContaminationTimeline';
import { sourceColorMap } from '@/lib/utils/riskColors';

export default function ForensicsDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { data: report, isLoading } = useForensicsReport(id);

    if (isLoading || !report) {
        return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-surface animate-pulse rounded-xl" />)}</div>;
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Forensics Report" description={`Report ID: ${report.id}`} />
            <ForensicsCard report={report} showLink={false} />
            <div className="bg-surface border border-accent/30 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4">Source Confidence</h3>
                <SourceConfidenceBar confidence={report.source_confidence} color={sourceColorMap[report.contamination_source]} />
            </div>
            <ContaminationTimeline events={[
                { time: 'T+0', label: 'Start', description: 'Contamination detected', type: 'detection' },
                { time: 'T+15m', label: 'Anomaly', description: 'Sensor anomaly flagged', type: 'threshold' },
                { time: 'T+30m', label: 'Alert', description: 'Health alert sent', type: 'alert' },
                { time: 'T+45m', label: 'Legal', description: 'Legal filing initiated', type: 'legal' },
            ]} />
            {report.supporting_evidence && Object.keys(report.supporting_evidence).length > 0 && (
                <div className="bg-surface border border-accent/30 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-text-primary mb-3">Supporting Evidence</h3>
                    <pre className="text-xs font-mono text-text-secondary bg-primary rounded-lg p-4 overflow-x-auto">
                        {JSON.stringify(report.supporting_evidence, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
