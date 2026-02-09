import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, BrainCircuit } from 'lucide-react'

export function AiInsightsPanel({ data }) {
    const [displayedText, setDisplayedText] = useState('')
    const [isTyping, setIsTyping] = useState(false)

    // Default text if data is missing or loading
    const fullText = data?.text || "Analyzing city data... Generating new insights..."

    useEffect(() => {
        if (!fullText) return

        let i = 0
        setDisplayedText('')
        setIsTyping(true)

        const type = () => {
            if (i < fullText.length) {
            setDisplayedText(fullText.slice(0, i + 1))
            i++
            requestAnimationFrame(type)
            } else {
            setIsTyping(false)
            }
        }

        type()
    }, [fullText])

    return (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <BrainCircuit className="w-24 h-24 text-primary" />
            </div>

            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-primary">
                    <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                    Today's AI Insight
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div className="min-h-[120px] max-h-[200px] overflow-y-auto text-base font-medium leading-relaxed break-words">
                    {displayedText}
                    {isTyping && <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse translate-y-0.5" />}
                </div>

                {data?.type === 'alert' && (
                    <div className="mt-3 text-xs font-semibold text-red-500 bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded inline-block">
                        ⚠️ Critical Attention Needed
                    </div>
                )}

                <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground px-2 pl-10">
                    <span>Source: Live City Data</span>
                    <span>Confidence: {Math.round((data?.confidence || 0.85) * 100)}%</span>
                </div>
            </CardContent>
        </Card>
    )
}
