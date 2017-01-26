import unittest
from availability import WeeklyTime, Availability
from datetime import datetime

class TestWeeklyTime(unittest.TestCase):
    def setUp(self):
        self.sunday_0000 = WeeklyTime(0, 0, 0)
        self.monday_0000 = WeeklyTime(1, 0, 0)
        self.sunday_2300 = WeeklyTime(0, 23, 0)
        self.sunday_0059 = WeeklyTime(0, 0, 59)
        self.saturday_0000 = WeeklyTime(6, 0, 0)
        self.dt_2017_01_29 = datetime(2017, 1, 29)
        self.dt_2017_01_29_0059 = datetime(2017, 1, 29, 00, 59)
        self.dt_2001_09_10 = datetime(2001, 9, 10)

    def test_str_saturday_0000(self):
        self.assertEqual(str(self.saturday_0000), 'Saturday 00:00')

    def test_str_sunday_0000(self):
        self.assertEqual(str(self.sunday_0000), 'Sunday 00:00')

    def test_sunday_0000_equals_sunday_0000(self):
        self.assertEqual(self.sunday_0000, WeeklyTime(0, 0, 0))

    def test_sunday_0000_does_not_equal_monday_0000(self):
        self.assertNotEqual(self.sunday_0000, self.monday_0000)

    def test_sunday_0000_does_not_equal_sunday_2300(self):
        self.assertNotEqual(self.sunday_0000, self.sunday_2300)

    def test_sunday_0000_does_not_equal_sunday_0059(self):
        self.assertNotEqual(self.sunday_0000, self.sunday_0059)

    def test_from_datetime_2017_01_29(self):
        self.assertEqual(WeeklyTime.from_datetime(self.dt_2017_01_29),
                         self.sunday_0000)

    def test_from_datetime_2017_01_29_0059(self):
        self.assertEqual(WeeklyTime.from_datetime(self.dt_2017_01_29_0059),
                         self.sunday_0059)

    def test_from_datetime_2001_09_10(self):
        self.assertEqual(WeeklyTime.from_datetime(self.dt_2001_09_10),
                         self.monday_0000)

    def test_first_datetime_after_same_time(self):
        self.assertEqual(self.sunday_0000.first_datetime_after(self.dt_2017_01_29),
                         self.dt_2017_01_29)

    def test_first_datetime_after_same_day_different_time(self):
        self.assertEqual(self.sunday_0059.first_datetime_after(datetime(2017, 1, 29, 0, 58)),
                         datetime(2017, 1, 29, 0, 59))
        self.assertEqual(self.sunday_0059.first_datetime_after(datetime(2017, 1, 29, 1, 0)),
                         datetime(2017, 2, 5, 0, 59))

    def test_first_datetime_after_different_days(self):
        self.assertEqual(self.saturday_0000.first_datetime_after(datetime(2017, 1, 31, 17, 44)),
                         datetime(2017, 2, 4, 0, 0))

    '''
    def test_split(self):
        s = 'hello world'
        self.assertEqual(s.split(), ['hello', 'world'])
        # check that s.split fails when the separator is not a string
        with self.assertRaises(TypeError):
            s.split(2)
    '''

class TestAvailability(unittest.TestCase):
    def setUp(self):
        self.time_slots_per_week = 672
        self.always_free_slots = [True for i in range(self.time_slots_per_week)]
        self.free_first_five_slots = [True if i < 5         
                                      else False
                                      for i in range(self.time_slots_per_week)]
        self.never_free_slots = [False for i in range(self.time_slots_per_week)]
        self.free_sat_sun_six_slots = [True if i < 3 or i >= self.time_slots_per_week - 3
                                       else False
                                       for i in range(self.time_slots_per_week)]
        self.always_free_avail = Availability(self.always_free_slots)
        self.free_first_five_avail = Availability(self.free_first_five_slots)
        self.never_free_avail = Availability(self.never_free_slots)
        self.free_sat_sun_six_avail = Availability(self.free_sat_sun_six_slots)

    def test_constants(self):
        self.assertEqual(Availability.MINUTES_PER_SLOT, 15)
        self.assertEqual(Availability.MINUTES_PER_COURSE, 90)
        self.assertEqual(Availability.SLOTS_PER_WEEK, self.time_slots_per_week)
        self.assertEqual(Availability.SLOT_START_TIMES[0], WeeklyTime(0,0,0))
        self.assertEqual(Availability.SLOT_START_TIMES[-1], WeeklyTime(6,23,45))
        self.assertEqual(Availability.SLOT_START_TIME_TO_INDEX[WeeklyTime(0,0,0)], 0)
        self.assertEqual(Availability.SLOT_START_TIME_TO_INDEX[WeeklyTime(6,23,45)],
                         self.time_slots_per_week-1)

    def test_time_str_to_index_0000(self):
        self.assertEqual(Availability.time_str_to_index('00:00'), 0)

    def test_time_str_to_index_0015(self):
        self.assertEqual(Availability.time_str_to_index('00:15'), 1)

    def test_time_str_to_index_2345(self):
        self.assertEqual(Availability.time_str_to_index('23:45'), 95)

    def test_time_str_to_index_2400(self):
        self.assertEqual(Availability.time_str_to_index('24:00'), 96)

    def test_initializer_value_error(self):
        with self.assertRaises(ValueError):
            Availability([True for i in range(671)])

    def test_str_never_free_avail(self):
        self.assertEqual(str(self.never_free_avail), '')

    def test_str_free_sat_sun_six_avail(self):
        avail_str = ('Sunday 00:00 - Sunday 00:15\n'
                     'Sunday 00:15 - Sunday 00:30\n'
                     'Sunday 00:30 - Sunday 00:45\n'
                     'Saturday 23:15 - Saturday 23:30\n'
                     'Saturday 23:30 - Saturday 23:45\n'
                     'Saturday 23:45 - Sunday 00:00')
        self.assertEqual(str(self.free_sat_sun_six_avail), avail_str)

    def test_

if __name__ == '__main__':
    unittest.main()