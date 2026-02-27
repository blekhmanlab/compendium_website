import { random, sum } from "lodash";
import { parse } from "papaparse";
import UploadButton from "@/components/UploadButton";
import { useUpload } from "@/pages/projectionist/Projectionist";

/** max read count to rarify down to */
const maxReads = 100;

const Upload = () => {
  return (
    <div>
      <UploadButton
        onUpload={async (file) => {
          const content = await file.text();

          /** parse data */
          const { data } = parse<[...number[], string]>(content, {
            dynamicTyping: true,
          });

          /** map of taxon name to column index */
          const taxa = Object.fromEntries(
            (data.shift() as string[]).map((key, index) => [index, key]),
          );
          /** map of sample name to per-taxon read counts */
          const samples = Object.fromEntries(
            data.map((row) => [row.pop() as string, row as number[]]),
          );

          /** rarify reads */
          for (const counts of Object.values(samples)) {
            /** total reads for sample */
            const total = sum(counts);
            /** how many reads we need to remove */
            const reduce = total - maxReads;
            for (let remove = reduce; remove > 0; remove--) {
              /** randomly select a read to remove */
              const randomRead = random(total);
              let cumulative = 0;
              /** find first col of reads that contains rand index */
              const index = counts.findIndex((count) => {
                cumulative += count;
                return cumulative > randomRead;
              });
              /** remove read from sample */
              counts[index] = (counts[index] ?? 0) - 1;
            }
          }

          /** "robust centered log-ratio transformation" */
          for (const counts of Object.values(samples)) {
            /** geometric mean */
            const nonZero = counts.filter((count) => count > 0);
            const product = nonZero.reduce(
              (product, count) => product * (count || 1),
              1,
            );
            const mean = product ** (1 / nonZero.length);

            counts.forEach((count, index) => {
              if (count === 0) return;
              /** log-ratio of count to geometric mean */
              counts[index] = Math.log(count / mean);
            });
          }

          /** set state */
          useUpload.setState({ taxa, samples });

          console.info({ taxa, samples });
        }}
      >
        Upload
      </UploadButton>
    </div>
  );
};

export default Upload;
