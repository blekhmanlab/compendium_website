import type * as ProjectionistAPI from "@/pages/projectionist/project";
import { useEffect, useState } from "react";
import { useDebounce } from "@reactuses/core";
import { wrap } from "comlink";
import { size } from "lodash";
import { LightbulbIcon } from "lucide-react";
import LoadingIcon from "@/assets/loading.svg?react";
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
      runData(async () =>
        useData.setState({
          userData: await projectionistWorker.parseUserData(userRawData),
        }),
      ),
    [userRawData, runData],
  );

  /** run parse meta */
  useEffect(
    () =>
      runMeta(async () =>
        useData.setState({
          userMeta: await projectionistWorker.parseUserMeta(userRawMeta),
        }),
      ),
    [userRawMeta, runMeta],
  );

  /** get global state */
  const data = useData((state) => state.userData);
  const meta = useData((state) => state.userMeta);

  return (
    <section>
      <h2>Upload</h2>

      <div
        className="
          grid w-full grid-cols-2 place-items-start gap-4
          *:min-h-0 *:min-w-0
          max-md:grid-cols-1
        "
      >
        <strong>Taxa Data</strong>
        <strong>Sample Meta</strong>

        <Textbox
          multi
          value={_userRawData}
          onChange={setUserRawData}
          placeholder="Paste data here"
        />

        <Textbox
          multi
          value={_userRawMeta}
          onChange={setUserRawMeta}
          placeholder="Paste meta here"
        />

        <UploadButton
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

        <UploadButton
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

        {dataStatus ? (
          <div className="flex items-center gap-4">
            <LoadingIcon />
            {dataStatus}
          </div>
        ) : (
          <div>
            {formatNumber(size(data?.samples))} samples
            <br />
            {formatNumber(size(data?.taxa))} taxa
          </div>
        )}

        {metaStatus ? (
          <div className="flex items-center gap-4">
            <LoadingIcon />
            {metaStatus}
          </div>
        ) : (
          <div>{formatNumber(size(meta))} sample meta</div>
        )}

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
