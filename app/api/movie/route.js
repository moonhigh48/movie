import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword');
  if (!keyword) return NextResponse.json([]);

  const url = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(keyword)}&language=ko-KR&include_adult=false`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const filteredResults = data.results?.filter(item => item.media_type === 'movie' || item.media_type === 'tv') || [];
    return NextResponse.json(filteredResults);
  } catch (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const movie = await request.json();
    if (!movie || !movie.id) throw new Error("Invalid movie data");

    const mediaType = movie.media_type || (movie.title ? 'movie' : 'tv');
    const movieId = movie.id;

    let actors = [];
    try {
      const creditsUrl = `https://api.themoviedb.org/3/${mediaType}/${movieId}/credits?api_key=${TMDB_API_KEY}&language=ko-KR`;
      const creditsRes = await fetch(creditsUrl);
      const creditsData = await creditsRes.json();
      actors = creditsData.cast?.slice(0, 5).map(actor => ({ name: actor.name.replace(/,/g, '') })) || [];
    } catch (e) {
      console.error(e);
    }

    const now = new Date();
    const krDate = new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Seoul',
    }).format(now).replace(/\. /g, '-').replace(/\./g, '');

    const imageUrl = movie.poster_path 
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
      : 'https://via.placeholder.com/500x750?text=No+Image';

    const countryMap = { ko: '한국', en: '미국', ja: '일본', zh: '중국' };
    const country = countryMap[movie.original_language] || '기타';

    const body = {
      parent: { database_id: NOTION_DATABASE_ID },
      icon: { type: "emoji", emoji: mediaType === 'tv' ? "📺" : "🎬" },
      properties: {
        "이름": { title: [{ text: { content: movie.title || movie.name || "Untitled" } }] },
        "Date": { date: { start: krDate } },
        "태그": { multi_select: [{ name: country }, { name: mediaType === 'tv' ? '드라마' : '영화' }] },
        "출연 배우": { multi_select: actors }
      },
      children: [
        {
          object: 'block',
          type: 'image',
          image: { type: 'external', external: { url: imageUrl } }
        },
        {
          object: 'block',
          type: 'heading_3',
          heading_3: { rich_text: [{ text: { content: "🍿 상세 줄거리" } }] }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: { rich_text: [{ text: { content: movie.overview || "설명이 없습니다." } }] }
        }
      ]
    };

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (response.ok) return NextResponse.json({ success: true });
    const result = await response.json();
    return NextResponse.json({ success: false, message: result.message }, { status: response.status });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}