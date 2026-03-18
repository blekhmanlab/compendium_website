import type { Remote } from "comlink";
import type * as ProjectionistWorkerType from "@/workers/projectionist.ts";
import { useCallback, useEffect, useState } from "react";
import { size } from "lodash";
import { LightbulbIcon } from "lucide-react";
import LoadingIcon from "@/assets/loading.svg?react";
import Button from "@/components/Button";
import Textbox from "@/components/Textbox";
import UploadButton from "@/components/UploadButton";
import { useData } from "@/pages/projectionist/Projectionist";
import { formatNumber } from "@/util/string";
import { useWorker } from "@/workers";
import ProjectionistWorker from "@/workers/projectionist.ts?worker";
import exampleData from "../data/example-data.tsv?raw";
import exampleMeta from "../data/example-meta.tsv?raw";

const Upload = () => {
  /** raw text input */
  const [userRawData, setUserRawData] = useState("");
  const [userRawMeta, setUserRawMeta] = useState("");

  /** parse user input */
  const [userData, userDataStatus] = useWorker(
    ProjectionistWorker,
    useCallback(
      (worker: Remote<typeof ProjectionistWorkerType>) => {
        if (!userRawData) return;
        return worker.parseUserData(userRawData);
      },
      [userRawData],
    ),
  );
  const [userMeta, userMetaStatus] = useWorker(
    ProjectionistWorker,
    useCallback(
      (worker: Remote<typeof ProjectionistWorkerType>) => {
        if (!userRawMeta) return;
        return worker.parseUserMeta(userRawMeta);
      },
      [userRawMeta],
    ),
  );

  /** update global state with parsed data */
  useEffect(() => {
    if (userData) useData.setState({ userData });
  }, [userData]);
  useEffect(() => {
    if (userMeta) useData.setState({ userMeta });
  }, [userMeta]);

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
          value={userRawData}
          onChange={setUserRawData}
          placeholder="Paste data here"
        />

        <Textbox
          multi
          value={userRawMeta}
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

        {userDataStatus ? (
          <div className="flex items-center gap-4">
            <LoadingIcon />
            {userDataStatus}
          </div>
        ) : (
          <div>
            {formatNumber(size(userData?.samples))} samples
            <br />
            {formatNumber(size(userData?.taxa))} taxa
          </div>
        )}

        {userMetaStatus ? (
          <div className="flex items-center gap-4">
            <LoadingIcon />
            {userMetaStatus}
          </div>
        ) : (
          <div>{formatNumber(size(userMeta))} sample meta</div>
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
