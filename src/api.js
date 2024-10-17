
import axios from 'axios';


const fetchCoinData = async (coinId) => {
  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: 30,  
      },
    });
    return response.data.prices; 
  } catch (error) {
    console.error('Error fetching data from CoinGecko:', error);
    return null;
  }
};

export default fetchCoinData;
