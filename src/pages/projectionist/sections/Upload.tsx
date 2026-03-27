import type * as ProjectionistAPI from "@/pages/projectionist/project";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@reactuses/core";
import { wrap } from "comlink";
import { size } from "lodash";
import { LightbulbIcon } from "lucide-react";
import Button from "@/components/Button";
import Textbox from "@/components/Textbox";
import UploadButton from "@/components/UploadButton";
import ProjectionistWorker from "@/pages/projectionist/project.ts?worker";
import { useData } from "@/pages/projectionist/state";
import { formatNumber } from "@/util/string";
import { useWorker } from "@/util/worker";
import exampleData from "../data/example-data.tsv?raw";
import exampleMeta from "../data/example-meta.tsv?raw";

const projectionistWorker = wrap<typeof ProjectionistAPI>(
  new ProjectionistWorker(),
);

const Upload = () => {
  /** refs for drag & drop targets */
  const dataRef = useRef<HTMLTextAreaElement>(null);
  const metaRef = useRef<HTMLTextAreaElement>(null);

  /** raw text input */
  const [_userRawData, setUserRawData] = useState("");
  const [_userRawMeta, setUserRawMeta] = useState("");
  /** debounced text input */
  const userRawData = useDebounce(_userRawData, 300);
  const userRawMeta = useDebounce(_userRawMeta, 300);

  /** parse user input */
  const [, dataStatus, runData] = useWorker(projectionistWorker);
  /** parse user meta */
  const [, metaStatus, runMeta] = useWorker(projectionistWorker);

  /** run parse data */
  useEffect(
    () =>
      runData(async () => {
        if (!userRawData.trim()) return;
        useData.setState({
          userData: await projectionistWorker.parseUserData(userRawData),
        });
      }),
    [userRawData, runData],
  );

  /** run parse meta */
  useEffect(
    () =>
      runMeta(async () => {
        if (!userRawMeta.trim()) return;
        useData.setState({
          userMeta: await projectionistWorker.parseUserMeta(userRawMeta),
        });
      }),
    [userRawMeta, runMeta],
  );

  /** get outputs of parsing */
  const data = useData((state) => state.userData);
  const meta = useData((state) => state.userMeta);

  return (
    <section className="width-lg">
      <h2>Upload</h2>

      <div
        className="
          grid w-full grid-cols-[2fr_1fr] gap-4
          max-md:grid-cols-1
        "
      >
        <div className="flex flex-col gap-4">
          <strong>Sample Data</strong>

          <Textbox
            ref={dataRef}
            multi
            value={_userRawData}
            onChange={setUserRawData}
            placeholder="Paste or drag data here"
            className="justify-self-stretch"
          />

          <div className="flex items-center gap-4">
            <UploadButton
              target={dataRef}
              accept={[
                ".txt",
                "text/plain",
                ".csv",
                "text/csv",
                ".tsv",
                "text/tab-separated-values",
              ]}
              onUpload={async (file) => setUserRawData(await file.text())}
            >
              Upload
            </UploadButton>

            {dataStatus ? (
              <>{dataStatus}</>
            ) : (
              <>
                <div>{formatNumber(size(data?.samples))} samples</div>
                <div>{formatNumber(size(data?.taxa))} taxa</div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <strong>Sample Meta</strong>

          <Textbox
            ref={metaRef}
            multi
            value={_userRawMeta}
            onChange={setUserRawMeta}
            placeholder="Paste or drag meta here"
            className="justify-self-stretch"
          />

          <div className="flex items-center gap-4">
            <UploadButton
              target={metaRef}
              accept={[
                ".txt",
                "text/plain",
                ".csv",
                "text/csv",
                ".tsv",
                "text/tab-separated-values",
              ]}
              onUpload={async (file) => setUserRawMeta(await file.text())}
            >
              Upload
            </UploadButton>

            {metaStatus ? (
              <div className="flex items-center gap-4">{metaStatus}</div>
            ) : (
              <div>{formatNumber(size(meta))} samples</div>
            )}
          </div>
        </div>

        <Button
          onClick={() => {
            setUserRawData(exampleData);
            setUserRawMeta(exampleMeta);
          }}
          className="col-span-full justify-self-center"
        >
          <LightbulbIcon />
          Example
        </Button>
      </div>
    </section>
  );
};

export default Upload;
