import { Text } from '@visx/text';
import { scaleLog } from '@visx/scale';
import Wordcloud from '@visx/wordcloud/lib/Wordcloud';
import { Keyword, KeywordSettings } from '@/app/utils/types';

interface KeywordcloudProps {
  width: number;
  height: number;
  keywords: string[];
  keywordSettings: {[keyword: string]: KeywordSettings},
}

export default function Keywordcloud({ width, height, keywords, keywordSettings }: KeywordcloudProps) {

    
    const defaultColors = ['#143059', '#2F6B9A', '#82a6c2'];


    function wordFreq(): Keyword[] {
        const freqMap: Record<string, number> = {};

        for (const w of keywords) {
            if (!freqMap[w]) freqMap[w] = 0;
            freqMap[w] += 1;
        }
        return Object.keys(freqMap).map((word) => ({ text: word, value: freqMap[word] }));
    }
    const words = wordFreq();

    const fontScale = scaleLog({
    domain: [Math.min(...words.map((w) => w.value)), Math.max(...words.map((w) => w.value))],
    range: [8,10],
    });
    const fontSizeSetter = (datum: Keyword) => fontScale(datum.value);

    const fixedValueGenerator = () => 0.5;
      
    return (
        <g transform={`translate (${-0.5*width - 10}, ${-0.5*height})`}>
            <Wordcloud
                words={words}
                width={width}
                height={height}
                fontSize={fontSizeSetter}
                font={'Impact'}
                padding={2}
                spiral={'rectangular'}
                rotate={0}
                random={fixedValueGenerator}
            >
                {(cloudWords) =>
                cloudWords.map((w, i) => (
                    <Text
                    key={w.text}
                    fill={keywordSettings[w.text as string]?.color || defaultColors[i % defaultColors.length]}
                    textAnchor={'middle'}
                    transform={`translate(${w.x}, ${w.y})`}
                    fontSize={w.size}
                    fontFamily={w.font}
                    >
                    {w.text}
                    </Text>
                ))
                }
            </Wordcloud>
        </g>
    );
}