import { create } from "zustand";
import ConeIcon from "@/assets/cone.svg?react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Meta from "@/components/Meta";
import Upload from "@/pages/projectionist/sections/Upload";

export type UserData = {
  taxa: Record<string, string>;
  samples: Record<string, number[]>;
};

export const useUserData = create<UserData>(() => ({ taxa: {}, samples: {} }));

export type UserMeta = Record<string, string>[];

export const useUserMeta = create<UserMeta>(() => []);

const Projectionist = () => (
  <>
    <Meta
      title="Projectionist"
      description="Compare your data with data from the Human Microbiome Compendium"
    />

    <Header>
      <h2>
        <ConeIcon />
        Projectionist
      </h2>
    </Header>

    <main>
      <section>
        <Upload />
      </section>
    </main>
    <Footer />
  </>
);

export default Projectionist;
