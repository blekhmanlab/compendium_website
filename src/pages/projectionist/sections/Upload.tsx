import type { Remote } from "comlink";
import type * as ProjectionistAPI from "@/pages/projectionist/project";
import { useCallback, useRef, useState } from "react";
import { useDebounce } from "@reactuses/core";
import clsx from "clsx";
import { size } from "lodash";
import { HelpCircleIcon, LightbulbIcon } from "lucide-react";
import Alert from "@/components/Alert";
import Button from "@/components/Button";
import Textbox from "@/components/Textbox";
import Tooltip from "@/components/Tooltip";
import UploadButton from "@/components/UploadButton";
import ProjectionistWorker from "@/pages/projectionist/project.ts?worker";
import { useData } from "@/pages/projectionist/state";
import { formatNumber } from "@/util/string";
import { useWorker } from "@/util/worker";
import exampleMeta from "../data/example/meta.tsv?raw";
import exampleReads from "../data/example/reads.tsv?raw";
import exampleTaxa from "../data/example/taxa.tsv?raw";

export default function Upload() {
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
  const userReads = useData((state) => state.userReads);
  const userTaxa = useData((state) => state.userTaxa);
  const userMeta = useData((state) => state.userMeta);

  /** get compendium data */
  const taxonPCs = useData((state) => state.taxonPCs);

  /** find taxa in user reads that have no match in user taxa */
  const missingInTaxa = userReads?.taxa
    ?.map((taxon, index) => {
      const sample = userReads?.samples?.[index] ?? index;
      if (!userTaxa?.[taxon]) return String(sample);
    })
    .filter((taxon) => taxon !== undefined);

  /** find samples in user reads that have no match in user meta */
  const missingInMeta = userReads?.samples
    ?.map((sample) => {
      if (!userMeta?.[sample]) return sample;
    })
    .filter((sample) => sample !== undefined);

  /** find user taxa that have no match in compendium taxa */
  const missingInCompendium = Object.entries(userTaxa ?? {})
    .map(([taxon, { kingdom, phylum, _class, order, family }]) => {
      const full = [kingdom, phylum, _class, order, family].join("|");
      if (!taxonPCs?.[full]) return taxon;
    })
    .filter((taxon) => taxon !== undefined);

  /** are there any alerts to show */
  const alerts =
    (missingInTaxa?.length ? 1 : 0) +
    (missingInMeta?.length ? 1 : 0) +
    (missingInCompendium?.length ? 1 : 0);

  return (
    <section className="width-lg">
      <h2>Upload</h2>

      <div className="grid w-full grid-cols-4 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
        <div className="flex flex-col gap-4 md:col-span-2">
          <div className="flex items-center gap-2">
            <strong>Reads</strong>{" "}
            <Tooltip
              content={
                <>
                  Read counts, per sample (row) and taxa (column).
                  <div className="mt-2 table-wrapper border-light-gray">
                    <table>
                      <thead>
                        <tr>
                          <th>sample</th>
                          <th>taxa1</th>
                          <th>taxa2</th>
                          <th>…</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>sample1</td>
                          <td>123</td>
                          <td>456</td>
                          <td>…</td>
                        </tr>
                        <tr>
                          <td>sample2</td>
                          <td>789</td>
                          <td>0</td>
                          <td>…</td>
                        </tr>
                        <tr>
                          <td>…</td>
                          <td>…</td>
                          <td>…</td>
                          <td>…</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              }
            >
              <HelpCircleIcon />
            </Tooltip>
          </div>

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
                <div>{formatNumber(size(userReads?.samples))} samples</div>
                <div>{formatNumber(size(userReads?.taxa))} taxa</div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <strong>Taxa</strong>{" "}
            <Tooltip
              content={
                <>
                  Taxa ranks for each column in reads table.
                  <div className="mt-2 table-wrapper border-light-gray">
                    <table>
                      <thead>
                        <tr>
                          <th>col id</th>
                          <th>kingdom</th>
                          <th>phylum</th>
                          <th>…</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>col1</td>
                          <td>Bacteria</td>
                          <td>Bacillota</td>
                          <td>…</td>
                        </tr>
                        <tr>
                          <td>col2</td>
                          <td>Archaea</td>
                          <td>Methan…</td>
                          <td>…</td>
                        </tr>
                        <tr>
                          <td>…</td>
                          <td>…</td>
                          <td>…</td>
                          <td>…</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              }
            >
              <HelpCircleIcon />
            </Tooltip>
          </div>

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
              <>{formatNumber(size(userTaxa))} taxa</>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <strong>Meta</strong>{" "}
            <Tooltip
              content={
                <>
                  Arbitrary metadata for each sample in reads table, to help
                  contextualize results.
                  <div className="mt-2 table-wrapper border-light-gray">
                    <table>
                      <thead>
                        <tr>
                          <th>sample</th>
                          <th>color</th>
                          <th>tag</th>
                          <th>…</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>sample1</td>
                          <td>red</td>
                          <td>simple</td>
                          <td>…</td>
                        </tr>
                        <tr>
                          <td>sample2</td>
                          <td>green</td>
                          <td>complex</td>
                          <td>…</td>
                        </tr>
                        <tr>
                          <td>…</td>
                          <td>…</td>
                          <td>…</td>
                          <td>…</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              }
            >
              <HelpCircleIcon />
            </Tooltip>
          </div>

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
              <div>{formatNumber(size(userMeta))} samples</div>
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

      {!!alerts && (
        <div
          className={clsx(
            "grid gap-4",
            alerts === 3 && "grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1",
            alerts === 2 && "grid-cols-2 max-sm:grid-cols-1",
            alerts === 1 && "grid-cols-1",
          )}
        >
          {!!missingInTaxa?.length && (
            <Alert type="error">
              {formatNumber(missingInTaxa?.length)} taxa in reads have no match
              in taxa:
              <br />
              {missingInTaxa?.join(", ")}
            </Alert>
          )}

          {!!missingInMeta?.length && (
            <Alert type="warn">
              {formatNumber(missingInMeta?.length)} sample(s) in reads have no
              match in meta:
              <br />
              {missingInMeta?.join(", ")}
            </Alert>
          )}

          {!!missingInCompendium?.length && (
            <Alert type="error">
              {formatNumber(missingInCompendium?.length)} taxa have no match in
              compendium:
              <br />
              {missingInCompendium?.join(", ")}
            </Alert>
          )}
        </div>
      )}
    </section>
  );
}

const accept = [
  ".txt",
  "text/plain",
  ".csv",
  "text/csv",
  ".tsv",
  "text/tab-separated-values",
];
