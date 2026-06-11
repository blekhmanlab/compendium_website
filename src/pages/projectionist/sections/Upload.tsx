import type { Remote } from "comlink";
import type * as ProjectionistAPI from "@/pages/projectionist/project";
import { useCallback, useRef, useState } from "react";
import { useDebounce } from "@reactuses/core";
import { size } from "lodash";
import { LightbulbIcon } from "lucide-react";
import Button from "@/components/Button";
import Textbox from "@/components/Textbox";
import UploadButton from "@/components/UploadButton";
import ProjectionistWorker from "@/pages/projectionist/project.ts?worker";
import { useData } from "@/pages/projectionist/state";
import { formatNumber } from "@/util/string";
import { useWorker } from "@/util/worker";
import exampleMeta from "../data/example/meta.tsv?raw";
import exampleReads from "../data/example/reads.tsv?raw";
import exampleTaxa from "../data/example/taxa.tsv?raw";

const Upload = () => {
  /** refs for drag & drop targets */
  const dataRef = useRef<HTMLTextAreaElement>(null);
  const taxaRef = useRef<HTMLTextAreaElement>(null);
  const metaRef = useRef<HTMLTextAreaElement>(null);

  /** raw text input */
  const [_userRawReads, setUserRawReads] = useState("");
  const [_userRawTaxa, setUserRawTaxa] = useState("");
  const [_userRawMeta, setUserRawMeta] = useState("");
  /** debounced text input */
  const userRawReads = useDebounce(_userRawReads, 300);
  const userRawTaxa = useDebounce(_userRawTaxa, 300);
  const userRawMeta = useDebounce(_userRawMeta, 300);

  /** parse user data */
  const [, dataStatus] = useWorker(
    ProjectionistWorker,
    useCallback(
      async (worker: Remote<typeof ProjectionistAPI>) => {
        if (!userRawReads.trim()) return;
        useData.setState({
          userReads: await worker.parseUserReads(userRawReads),
        });
      },
      [userRawReads],
    ),
  );
  const [, taxaStatus] = useWorker(
    ProjectionistWorker,
    useCallback(
      async (worker: Remote<typeof ProjectionistAPI>) => {
        if (!userRawTaxa.trim()) return;
        useData.setState({
          userTaxa: await worker.parseUserTaxa(userRawTaxa),
        });
      },
      [userRawTaxa],
    ),
  );
  const [, metaStatus] = useWorker(
    ProjectionistWorker,
    useCallback(
      async (worker: Remote<typeof ProjectionistAPI>) => {
        if (!userRawMeta.trim()) return;
        useData.setState({
          userMeta: await worker.parseUserMeta(userRawMeta),
        });
      },
      [userRawMeta],
    ),
  );

  /** get outputs of parsing */
  const reads = useData((state) => state.userReads);
  const taxa = useData((state) => state.userTaxa);
  const meta = useData((state) => state.userMeta);

  return (
    <section className="width-lg">
      <h2>Upload</h2>

      <div
        className="
          grid w-full grid-cols-4 gap-4
          max-lg:grid-cols-2
          max-md:grid-cols-1
        "
      >
        <div
          className="
            flex flex-col gap-4
            md:col-span-2
          "
        >
          <strong>Reads</strong>

          <Textbox
            ref={dataRef}
            multi
            value={_userRawReads}
            onChange={setUserRawReads}
            placeholder="Paste or drag"
            className="justify-self-stretch"
          />

          <div className="flex items-center gap-4">
            <UploadButton
              target={dataRef}
              accept={accept}
              onUpload={async (file) => setUserRawReads(await file.text())}
            >
              Upload
            </UploadButton>

            {dataStatus ? (
              <>{dataStatus}</>
            ) : (
              <>
                <div>{formatNumber(size(reads?.samples))} samples</div>
                <div>{formatNumber(size(reads?.taxa))} taxa</div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <strong>Taxa</strong>

          <Textbox
            ref={taxaRef}
            multi
            value={_userRawTaxa}
            onChange={setUserRawTaxa}
            placeholder="Paste or drag"
            className="justify-self-stretch"
          />

          <div className="flex items-center gap-4">
            <UploadButton
              target={taxaRef}
              accept={accept}
              onUpload={async (file) => setUserRawTaxa(await file.text())}
            >
              Upload
            </UploadButton>

            {taxaStatus ? (
              <>{taxaStatus}</>
            ) : (
              <>{formatNumber(size(taxa))} taxa</>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <strong>Meta</strong>

          <Textbox
            ref={metaRef}
            multi
            value={_userRawMeta}
            onChange={setUserRawMeta}
            placeholder="Paste or drag"
            className="justify-self-stretch"
          />

          <div className="flex items-center gap-4">
            <UploadButton
              target={metaRef}
              accept={accept}
              onUpload={async (file) => setUserRawMeta(await file.text())}
            >
              Upload
            </UploadButton>

            {metaStatus ? (
              <>{metaStatus}</>
            ) : (
              <div>{formatNumber(size(meta))} samples</div>
            )}
          </div>
        </div>
      </div>

      <Button
        onClick={() => {
          setUserRawReads(exampleReads);
          setUserRawTaxa(exampleTaxa);
          setUserRawMeta(exampleMeta);
        }}
        className="col-span-full justify-self-center"
      >
        <LightbulbIcon />
        Example
      </Button>
    </section>
  );
};

export default Upload;

const accept = [
  ".txt",
  "text/plain",
  ".csv",
  "text/csv",
  ".tsv",
  "text/tab-separated-values",
];
