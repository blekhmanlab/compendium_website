import { useCallback, useEffect, useState } from "react";
import { size } from "lodash";
import LightbulbIcon from "@/assets/lightbulb.svg?react";
import LoadingIcon from "@/assets/loading.svg?react";
import Button from "@/components/Button";
import Textbox from "@/components/Textbox";
import UploadButton from "@/components/UploadButton";
import { useUserData, useUserMeta } from "@/pages/projectionist/Projectionist";
import { formatNumber } from "@/util/string";
import { useThread } from "@/workers";
import classes from "./Upload.module.css";
import exampleData from "../data/example-data.tsv?raw";
import exampleMeta from "../data/example-meta.tsv?raw";

const Upload = () => {
  /** raw text input */
  const [userRawData, setUserRawData] = useState("");
  const [userRawMeta, setUserRawMeta] = useState("");

  /** parse user input */
  const [userData, userDataStatus] = useThread(
    useCallback(
      (worker) => {
        if (!userRawData) return;
        return worker.parseUserData(userRawData);
      },
      [userRawData],
    ),
  );
  const [userMeta, userMetaStatus] = useThread(
    useCallback(
      (worker) => {
        if (!userRawMeta) return;
        return worker.parseUserMeta(userRawMeta);
      },
      [userRawMeta],
    ),
  );

  /** update global state with parsed data */
  useEffect(() => {
    if (userData) useUserData.setState({ ...userData });
  }, [userData]);
  useEffect(() => {
    if (userMeta) useUserMeta.setState({ ...userMeta });
  }, [userMeta]);

  return (
    <>
      <h2>Upload</h2>

      <div className={classes.upload}>
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
          <div className={classes.status}>
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
          <div className={classes.status}>
            <LoadingIcon />
            {userMetaStatus}
          </div>
        ) : (
          <div>{formatNumber(size(userMeta))} sample meta</div>
        )}

        <Button
          icon={LightbulbIcon}
          onClick={() => {
            setUserRawData(exampleData);
            setUserRawMeta(exampleMeta);
          }}
          className={classes.example}
        >
          Example
        </Button>
      </div>
    </>
  );
};

export default Upload;
