package com.app.pug.adapters;

import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentPagerAdapter;

import com.app.pug.HomeActivity;
import com.app.pug.fragments.EmptyFragment;
import com.app.pug.fragments.GameScreenFragment;
import com.app.pug.fragments.HomeFragment;
import com.app.pug.fragments.ProfileScreenFragment;
import com.app.pug.fragments.ScreenTournamentFragment;

public class ScreenPagerAdapter extends FragmentPagerAdapter {
    public ScreenPagerAdapter(FragmentManager manager) {
        super(manager);
    }

    @Override
    public Fragment getItem(int position) {
        switch (position) {
            case 0:
                return new HomeFragment();
            case 1:
                return new GameScreenFragment();
            case 2:
                return ScreenTournamentFragment.newInstance();
            case 3:
                return new ProfileScreenFragment();
            default:
                return new EmptyFragment();
        }
    }

    @Override
    public int getCount() {
        return HomeActivity.SCREEN_COUNT;
    }
}
