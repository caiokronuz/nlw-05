import Head from 'next/head'
import { GetStaticPaths, GetStaticProps } from 'next';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR'
import Image from 'next/image';
import Link from 'next/link';
import { convertDurationToTimeString } from '../../utils/convertDurationToTimeString';

import { api } from '../../services/api';
import { usePlayer } from '../../contexts/PlayerContext';

import styles from './episode.module.scss';

type Episode = {
    id: string;
    title: string;
    thumbnail: string;
    members: string;
    publishedAt: string,
    duration: number,
    durationAsString: string;
    description: string;
    url: string;
}

type EpisodeProps = {
    episode: Episode;
}

export default function Episode({ episode }: EpisodeProps) {
    const { play } = usePlayer();
    
    return (
        <div className={styles.episode}>

            <Head>
                <title>{episode.title} | Podcastr</title>
            </Head>

            <div className={styles.thumbnailContainer}>
                <Link href="/">
                    <button type="button">
                        <img src="/arrow-left.svg" alt="Voltar" />
                    </button>
                </Link>
                <Image
                    width={700}
                    height={160}
                    src={episode.thumbnail}
                    objectFit='cover'
                />
                <button type="button" onClick={() => play(episode)}>
                    <img src="/play.svg" alt="Tocar episódio"/>
                </button>
            </div>

            <header>
                <h1>{episode.title}</h1>
                <span>{episode.members}</span>
                <span>{episode.publishedAt}</span>
                <span>{episode.durationAsString}</span>
            </header>

            <div className={styles.description} dangerouslySetInnerHTML={{__html: episode.description}}/>

        </div>
    )
}

/*

-> getStaticPaths <-

Retorna quais episodios queremos gerar de forma estática no momento da build.
Como passamos o "paths" vazio, o next entende que não será gerado nenhum epi-
-sódio de forma estática no momento da build.
O "fallback" determina o comportamento quando uma pessoa acessa a página de um
episodio que não foi gerado estaticamente.

fallback: false -> Se a pessoa acessar um episódio que não foi gerado estaticamente
irá retornar 404

fallback: true -> Se a pessoa acessar um episódio que não foi gerado estaticamente,
o next ira buscar os dados daquele episódio que a pessoa esta acessanto, para assim,
ser criado uma página estática do episódio. Porém, o fallback sendo TRUE, a requisição
para a API não acontecera mais do lado do servidor, e sim no lado do cliente. 

fallback: blocking -> Com o fallback blocking, a requisição para buscar os dados do 
episódio, não rodará nem na backend, nem em client-side, irá rodar no servidor gerado
pelo next.

client(browser) - next.js - server(back-end)

*/
export const getStaticPaths: GetStaticPaths = async () => {
    return {
        paths: [],
        fallback: 'blocking'
    }
}

export const getStaticProps: GetStaticProps = async (ctx) => {
    const { slug } = ctx.params;
    const { data } = await api.get(`/episodes/${slug}`)

    const episode = {
        id: data.id,
        title: data.title,
        thumbnail: data.thumbnail,
        members: data.members,
        publishedAt: format(parseISO(data.published_at), 'd MMM yy', { locale: ptBR }),
        duration: Number(data.file.duration),
        durationAsString: convertDurationToTimeString(Number(data.file.duration)),
        description: data.description,
        url: data.file.url,
    }

    return {
        props: {
            episode,
        },
        revalidate: 60 * 60 * 24, //24 horas
    }
}