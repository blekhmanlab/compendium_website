import type { Remote } from "comlink";
import type * as ProjectionistAPI from "@/pages/projectionist/project";
import { useCallback, useState } from "react";
import { useDebounce } from "@reactuses/core";
import clsx from "clsx";
import { isEmpty, size } from "lodash";
import { HelpCircleIcon, LightbulbIcon } from "lucide-react";
import Alert from "@/components/Alert";
import Button from "@/components/Button";
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
  /** raw text input */
  const [_userRawReads, setUserRawReads] = useState("");
  const [_userRawTaxa, setUserRawTaxa] = useState("");
  const [_userRawMeta, setUserRawMeta] = useState("");
  /** debounced text input */
  const userRawReads = useDebounce(_userRawReads, 300);
  const userRawTaxa = useDebounce(_userRawTaxa, 300);
  const userRawMeta = useDebounce(_userRawMeta, 300);

  /** parse user data */
  const [, readsStatus] = useWorker(
    ProjectionistWorker,
    useCallback(
      async (worker: Remote<typeof ProjectionistAPI>) => {
        useData.setState({
          userReads: userRawReads.trim()
            ? await worker.parseUserReads(userRawReads)
            : { reads: [], taxa: [], samples: [] },
        });
      },
      [userRawReads],
    ),
  );
  const [, taxaStatus] = useWorker(
    ProjectionistWorker,
    useCallback(
      async (worker: Remote<typeof ProjectionistAPI>) => {
        useData.setState({
          userTaxa: userRawTaxa.trim()
            ? await worker.parseUserTaxa(userRawTaxa)
            : {},
        });
      },
      [userRawTaxa],
    ),
  );
  const [, metaStatus] = useWorker(
    ProjectionistWorker,
    useCallback(
      async (worker: Remote<typeof ProjectionistAPI>) => {
        useData.setState({
          userMeta: userRawMeta.trim()
            ? await worker.parseUserMeta(userRawMeta)
            : {},
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
  const missingInTaxa = !isEmpty(userTaxa)
    ? userReads?.taxa
        ?.map((taxon, index) => {
          const sample = userReads?.samples?.[index] ?? index;
          if (!userTaxa?.[taxon]) return String(sample);
        })
        .filter((taxon) => taxon !== undefined)
    : [];

  /** find samples in user reads that have no match in user meta */
  const missingInMeta = !isEmpty(userMeta)
    ? userReads?.samples
        ?.map((sample) => {
          if (!userMeta?.[sample]) return sample;
        })
        .filter((sample) => sample !== undefined)
    : [];

  /** find user taxa that have no match in compendium taxa */
  const missingInCompendium = !isEmpty(userTaxa)
    ? Object.entries(userTaxa ?? {})
        .map(([taxon, { kingdom, phylum, _class, order, family }]) => {
          const full = [kingdom, phylum, _class, order, family].join("|");
          if (!taxonPCs?.[full]) return taxon;
        })
        .filter((taxon) => taxon !== undefined)
    : [];

  /** are there any alerts to show */
  const alerts =
    (missingInTaxa?.length ? 1 : 0) +
    (missingInMeta?.length ? 1 : 0) +
    (missingInCompendium?.length ? 1 : 0);

  return (
    <section className="width-lg">
      <h2>Upload</h2>

      <div className="grid grid-cols-[repeat(4,auto)] items-center gap-4">
        {/* reads table */}
        <strong>Reads</strong>
        <Tooltip
          content={
            <>
              Provide a CSV/TSV of your read counts, per sample (row) and taxa
              (column), like so:
              <div className="mt-2 table-wrapper border-light-gray">
                <table>
                  <thead>
                    <tr>
                      <th>sample</th>
                      <th>taxon1</th>
                      <th>taxon2</th>
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
        <UploadButton
          accept={accept}
          onUpload={async (file) => setUserRawReads(await file.text())}
        >
          Upload
        </UploadButton>
        {readsStatus || (
          <div className="flex gap-2">
            <div>{formatNumber(size(userReads?.samples))} samples</div>
            <div>{formatNumber(size(userReads?.taxa))} taxa</div>
          </div>
        )}

        {/* taxa table */}
        <strong>Taxa</strong>
        <Tooltip
          content={
            <>
              Provide a CSV/TSV of taxa ranks for each column in your reads
              table, like so:
              <div className="mt-2 table-wrapper border-light-gray">
                <table>
                  <thead>
                    <tr>
                      <th>taxon</th>
                      <th>kingdom</th>
                      <th>phylum</th>
                      <th>…</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>taxon1</td>
                      <td>Bacteria</td>
                      <td>Bacillota</td>
                      <td>…</td>
                    </tr>
                    <tr>
                      <td>taxon2</td>
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
        <UploadButton
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

        {/* meta table */}
        <strong>Meta</strong>
        <Tooltip
          content={
            <>
              To help contextualize results, provide a CSV/TSV of arbitrary
              metadata for each sample in your reads table, like so:
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
        <UploadButton
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

      <Button
        onClick={() => {
          setUserRawReads(exampleReads);
          setUserRawTaxa(exampleTaxa);
          setUserRawMeta(exampleMeta);
        }}
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
              <div>
                {formatNumber(missingInTaxa?.length)} taxa in reads have no
                match in taxa:
              </div>
              <div className="line-clamp-2">{missingInTaxa?.join(", ")}</div>
            </Alert>
          )}

          {!!missingInMeta?.length && (
            <Alert type="warn">
              <div>
                {formatNumber(missingInMeta?.length)} sample(s) in reads have no
                match in meta:
              </div>
              <div className="line-clamp-2">{missingInMeta?.join(", ")}</div>
            </Alert>
          )}

          {!!missingInCompendium?.length && (
            <Alert type="warn">
              <div>
                {formatNumber(missingInCompendium?.length)} taxa have no match
                in compendium:
              </div>
              <div className="line-clamp-2">
                {missingInCompendium?.join(", ")}
              </div>
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
