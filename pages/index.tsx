import { NftType, UserType } from 'interfaces';
import React, { useEffect, useState } from 'react';
import { decryptCookie, setUserFromDApp } from 'utils/cookie';
import { getUser, getUsers } from 'actions/user';

import BetaBanner from 'components/base/BetaBanner';
import Head from 'next/head';
import Landing from 'components/pages/Landing';
import MainHeader from 'components/base/MainHeader';
import { NextPageContext } from 'next';
import TernoaWallet from 'components/base/TernoaWallet';
import arrayShuffle from 'array-shuffle';
import cookies from 'next-cookies';
import { getCapsValue } from 'actions/caps';
import { getNFTs } from 'actions/nft';

export interface LandingProps {
  user: UserType;
  users: UserType[];
  capsValue?: number;
  heroNFTs: NftType[];
  popularNfts: NftType[];
  bestSellingNfts: NftType[];
  NFTCreators: NftType[];
  totalCountNFT: number;
}
const LandingPage = ({
  user,
  users,
  capsValue,
  heroNFTs,
  popularNfts,
  bestSellingNfts,
  NFTCreators,
  totalCountNFT,
}: LandingProps) => {
  const [modalExpand, setModalExpand] = useState(false);
  const [walletUser, setWalletUser] = useState(user);

  useEffect(() => {
    setUserFromDApp(setWalletUser);
  }, []);

  return (
    <>
      <Head>
        <title>
          {process.env.NEXT_PUBLIC_APP_NAME
            ? process.env.NEXT_PUBLIC_APP_NAME
            : 'SecretNFT'}{' '}
          - Welcome
        </title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta name="description" content="SecretNFT Marketplace, by Ternoa." />
        <meta name="og:image" content="ternoa-social-banner.jpg" />
        <meta property="og:image" content="ternoa-social-banner.jpg" />
      </Head>
      {modalExpand && <TernoaWallet setModalExpand={setModalExpand} />}
      <BetaBanner />
      <MainHeader
        user={walletUser as UserType}
        setModalExpand={setModalExpand}
      />
      <Landing
        setModalExpand={setModalExpand}
        user={walletUser as UserType}
        users={users}
        capsValue={capsValue}
        heroNFTs={heroNFTs}
        popularNfts={popularNfts}
        bestSellingNfts={bestSellingNfts}
        NFTCreators={NFTCreators}
        totalCountNFT={totalCountNFT}
      />
    </>
  );
};
export async function getServerSideProps(ctx: NextPageContext) {
  const token =
    (ctx.query.walletId as string) ||
    (cookies(ctx).token && decryptCookie(cookies(ctx).token as string));
  let users: UserType[] = [],
    user: UserType | null = null,
    regularNfts: NftType[] = [],
    capsValue: number | undefined = undefined;
  const promises = [];
  promises.push(
    new Promise<void>((success) => {
      getUsers(undefined, true)
        .then((result) => {
          users = result.data;
          success();
        })
        .catch(success);
    })
  );
  if (token) {
    promises.push(
      new Promise<void>((success) => {
        getUser(token, undefined, true)
          .then((_user) => {
            user = _user;
            success();
          })
          .catch(success);
      })
    );
  }
  promises.push(
    new Promise<void>((success) => {
      getNFTs(undefined, '1', '19', true, true)
        .then((result) => {
          regularNfts = result.data;
          success();
        })
        .catch(success);
    })
  );
  promises.push(
    new Promise<void>((success) => {
      getCapsValue()
        .then((_value) => {
          capsValue = _value;
          success();
        })
        .catch(success);
    })
  );
  await Promise.all(promises);
  users = arrayShuffle(users);
  let popularNfts = arrayShuffle((regularNfts || []).slice(0, 8));
  let heroNFTs =
    popularNfts.length > 3
      ? arrayShuffle(popularNfts).slice(0, 3)
      : popularNfts; // TODO: Fetch dedicated data
  let bestSellingNfts = arrayShuffle((regularNfts || []).slice(8, 16));
  let NFTCreators = arrayShuffle((regularNfts || []).slice(16, 19));
  let totalCountNFT = (regularNfts || []).length;
  return {
    props: {
      user,
      users,
      capsValue,
      heroNFTs,
      popularNfts,
      bestSellingNfts,
      NFTCreators,
      totalCountNFT,
    },
  };
}

export default LandingPage;
