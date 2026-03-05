import { useCallback, useEffect, useState } from "react";
import * as d3 from "d3";
import { size } from "lodash";
import LightbulbIcon from "@/assets/lightbulb.svg?react";
import LoadingIcon from "@/assets/loading.svg?react";
import Button from "@/components/Button";
import Textbox from "@/components/Textbox";
import UploadButton from "@/components/UploadButton";
import { useUserData, useUserMeta } from "@/pages/projectionist/Projectionist";
import { formatNumber } from "@/util/string";
import { useThread } from "@/workers";
import { compendiumPCA } from "@/workers/worker";
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

  const plot1bound =
    d3.max(
      [
        d3.extent(Object.values(compendiumPCA), (d) => d.PC1),
        d3.extent(Object.values(compendiumPCA), (d) => d.PC2),
      ]
        .flat()
        .map((value) => Math.abs(value ?? 0)),
    ) ?? 0;
  const plot2bound =
    d3.max(
      [
        d3.extent(userData?.projected ?? [], (d) => d.PC1),
        d3.extent(userData?.projected ?? [], (d) => d.PC2),
      ]
        .flat()
        .map((value) => Math.abs(value ?? 0)),
    ) ?? 0;

  useEffect(() => {
    console.log({ plot1bound, plot2bound });
  }, [plot1bound, plot2bound]);

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

        <svg
          viewBox={[
            -plot1bound,
            -plot1bound,
            plot1bound * 2,
            plot1bound * 2,
          ].join(" ")}
          width="100%"
          height="100%"
        >
          <rect
            x={-plot1bound}
            y={-plot1bound}
            width={plot1bound * 2}
            height={plot1bound * 2}
            fill="none"
            stroke="white"
            strokeWidth={plot1bound / 100}
          />
          {Object.values(compendiumPCA).map(({ PC1, PC2 }, index) => (
            <circle
              key={index}
              cx={PC1}
              cy={PC2}
              r={plot1bound / 100}
              fill="white"
            />
          ))}
        </svg>

        <svg
          viewBox={[
            -plot2bound,
            -plot2bound,
            plot2bound * 2,
            plot2bound * 2,
          ].join(" ")}
          width="100%"
          height="100%"
        >
          <rect
            x={-plot2bound}
            y={-plot2bound}
            width={plot2bound * 2}
            height={plot2bound * 2}
            fill="none"
            stroke="white"
            strokeWidth={plot2bound / 100}
          />
          {userData?.projected?.map(({ PC1, PC2 }, index) => (
            <circle
              key={index}
              cx={PC1}
              cy={PC2}
              r={plot2bound / 100}
              fill="white"
            />
          ))}
        </svg>
      </div>
    </>
  );
};

export default Upload;
