package com.app.pug.adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.app.pug.R;
import com.app.pug.models.UpcomingPlayedItem;

import java.util.ArrayList;
import java.util.Locale;

public class UpcomingPlayedAdapter extends ArrayAdapter<UpcomingPlayedItem> {

    private Context context;
    private ArrayList<UpcomingPlayedItem> items;

    public UpcomingPlayedAdapter(Context context, int resource, ArrayList<UpcomingPlayedItem> items) {
        super(context, resource, items);
        this.context = context;
        this.items = items;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        View root = convertView;
        Holder holder;
        if (root == null) {
            root = LayoutInflater.from(context).inflate(R.layout.upcoming_played_item_layout, parent, false);
            holder = new Holder(root);
            root.setTag(holder);
        } else {
            holder = (Holder) root.getTag();
        }
        UpcomingPlayedItem playerItem = items.get(position);
        holder.dateTime.setText(playerItem.dateTime);
        holder.location.setText(playerItem.location);
        holder.joined.setText(String.format(Locale.getDefault(), "%d joined", playerItem.joined));
        int left = playerItem.left;
        holder.left.setText(String.format(Locale.getDefault(), "(%s)", left == 0 ? "Full" : String.format(Locale.getDefault(), "%d spot%s left",
                left, left == 1 ? "" : "s")));

//        holder.playerContainer.removeAllViews();
//        for (ImageView drawable : playerItem.images) {
//            holder.playerContainer.addView(drawable);
//        }

        return root;
    }

    private class Holder {
        TextView dateTime;
        TextView location;
        TextView joined;
        TextView left;
        LinearLayout playerContainer;

        public Holder(View root) {
            dateTime = (TextView) root.findViewById(R.id.game_item_date_time);
            location = (TextView) root.findViewById(R.id.game_item_location);
            joined = (TextView) root.findViewById(R.id.position_count_joined);
            left = (TextView) root.findViewById(R.id.position_count_left);
            playerContainer = (LinearLayout) root.findViewById(R.id.game_item_player_container);
        }
    }

    @Override
    public int getCount() {
        return items.size();
    }
}
