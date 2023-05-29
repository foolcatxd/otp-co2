import axios from "axios";
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
import { emissions } from "./emissions";

export async function plan(event) {
  try {
    const response = await axios.get('https://finland-staging.trip-planner.maas.global/otp/routers/default/plan', {
      headers: {
        'x-api-key': process.env.X_API_KEY
      },
      params: event.queryStringParameters
    })


    const itineraries = response.data.plan.itineraries.map(itinerary => {
      let totalCo2 = 0;
      let maxDistance = 0;
      const legs = itinerary.legs.map(leg => {
        const co2 = leg.distance * emissions[leg.mode]
        totalCo2 += co2
        maxDistance += leg.distance
        return {
          mode: leg.mode,
          distance: leg.distance,
          routeShortName: leg.routeShortName,
          co2,
        }
      })

      return {
        co2: totalCo2,
        duration: itinerary.duration,
        startTime: itinerary.startTime,
        endTime: itinerary.endTime,
        distance: maxDistance,
        legs,
      }
    })

    return {
      plan: {
        from: response.data.plan.from,
        to: response.data.plan.to,
        itineraries
      }
    }
  } catch (error) {
    console.log(error)
    return {
      status: 500,
      message: 'Internal server error!',
      error,
    }
  }
}
